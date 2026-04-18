package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
)

var db *sql.DB

func main() {
	var err error
	connStr := "host=localhost port=5432 user=postgres password=123456 dbname=postgres sslmode=disable"
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("DB open error:", err)
	}
	if err = db.Ping(); err != nil {
		log.Fatal("DB connect error:", err)
	}
	fmt.Println("✅ LDII Palmerah API connected to PostgreSQL")

	r := mux.NewRouter()
	r.Use(corsMiddleware)

	api := r.PathPrefix("/api").Subrouter()

	// Auth
	api.HandleFunc("/login", handleLogin).Methods("POST", "OPTIONS")

	// Users
	api.HandleFunc("/users", getUsers).Methods("GET", "OPTIONS")
	api.HandleFunc("/users", createUser).Methods("POST", "OPTIONS")
	api.HandleFunc("/users/{id}", updateUser).Methods("PUT", "OPTIONS")
	api.HandleFunc("/users/{id}", deleteUser).Methods("DELETE", "OPTIONS")

	// Berita
	api.HandleFunc("/berita", getBerita).Methods("GET", "OPTIONS")
	api.HandleFunc("/berita/published", getBeritaPublished).Methods("GET", "OPTIONS")
	api.HandleFunc("/berita/{id:[0-9]+}", getBeritaDetail).Methods("GET", "OPTIONS")
	api.HandleFunc("/berita", createBerita).Methods("POST", "OPTIONS")
	api.HandleFunc("/berita/{id}", updateBerita).Methods("PUT", "OPTIONS")
	api.HandleFunc("/berita/{id}", deleteBerita).Methods("DELETE", "OPTIONS")

	// Serve uploads
	r.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	log.Println("Server berjalan di http://localhost:8082")
	log.Fatal(http.ListenAndServe(":8082", r))
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// ===== AUTH =====
func handleLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	if strings.TrimSpace(req.Email) == "" || strings.TrimSpace(req.Password) == "" {
		jsonError(w, "Email dan password wajib diisi", 400)
		return
	}

	var u struct {
		ID   int    `json:"id"`
		Name string `json:"name"`
		Role string `json:"role"`
	}
	err := db.QueryRow(`SELECT id, name, role FROM lp_users WHERE email=$1 AND password=$2`,
		req.Email, req.Password).Scan(&u.ID, &u.Name, &u.Role)
	if err != nil {
		jsonError(w, "Email atau password salah", 401)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"id": u.ID, "name": u.Name, "email": req.Email, "role": u.Role})
}

// ===== USERS =====
func getUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(`SELECT id, name, email, role, TO_CHAR(created_at,'YYYY-MM-DD') FROM lp_users ORDER BY id`)
	if err != nil {
		jsonError(w, err.Error(), 500)
		return
	}
	defer rows.Close()

	type User struct {
		ID        int    `json:"id"`
		Name      string `json:"name"`
		Email     string `json:"email"`
		Role      string `json:"role"`
		CreatedAt string `json:"created_at"`
	}
	users := []User{}
	for rows.Next() {
		var u User
		rows.Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.CreatedAt)
		users = append(users, u)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func createUser(w http.ResponseWriter, r *http.Request) {
	var u struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}
	json.NewDecoder(r.Body).Decode(&u)
	if u.Name == "" || u.Email == "" || u.Password == "" {
		jsonError(w, "Name, email, password wajib diisi", 400)
		return
	}
	if u.Role == "" {
		u.Role = "editor"
	}

	var id int
	err := db.QueryRow(`INSERT INTO lp_users (name,email,password,role) VALUES ($1,$2,$3,$4) RETURNING id`,
		u.Name, u.Email, u.Password, u.Role).Scan(&id)
	if err != nil {
		jsonError(w, "Gagal: "+err.Error(), 500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(201)
	json.NewEncoder(w).Encode(map[string]interface{}{"id": id, "message": "User created"})
}

func updateUser(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	var u struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}
	json.NewDecoder(r.Body).Decode(&u)

	if u.Password != "" {
		db.Exec(`UPDATE lp_users SET name=$1, email=$2, password=$3, role=$4 WHERE id=$5`,
			u.Name, u.Email, u.Password, u.Role, id)
	} else {
		db.Exec(`UPDATE lp_users SET name=$1, email=$2, role=$3 WHERE id=$4`,
			u.Name, u.Email, u.Role, id)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "User updated"})
}

func deleteUser(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	db.Exec(`DELETE FROM lp_users WHERE id=$1`, id)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "User deleted"})
}

// ===== BERITA =====
func getBerita(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(`SELECT id, judul, konten, COALESCE(gambar,''), COALESCE(penulis,''),
		published, COALESCE(kategori,'berita'), TO_CHAR(created_at,'YYYY-MM-DD') FROM lp_berita ORDER BY id DESC`)
	if err != nil {
		jsonError(w, err.Error(), 500)
		return
	}
	defer rows.Close()

	type Berita struct {
		ID        int    `json:"id"`
		Judul     string `json:"judul"`
		Konten    string `json:"konten"`
		Gambar    string `json:"gambar"`
		Penulis   string `json:"penulis"`
		Published bool   `json:"published"`
		Kategori  string `json:"kategori"`
		CreatedAt string `json:"created_at"`
	}
	list := []Berita{}
	for rows.Next() {
		var b Berita
		rows.Scan(&b.ID, &b.Judul, &b.Konten, &b.Gambar, &b.Penulis, &b.Published, &b.Kategori, &b.CreatedAt)
		list = append(list, b)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

func getBeritaPublished(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(`SELECT id, judul, konten, COALESCE(gambar,''), COALESCE(penulis,''),
		COALESCE(kategori,'berita'), TO_CHAR(created_at,'YYYY-MM-DD') FROM lp_berita WHERE published=true ORDER BY id DESC`)
	if err != nil {
		jsonError(w, err.Error(), 500)
		return
	}
	defer rows.Close()

	type Berita struct {
		ID        int    `json:"id"`
		Judul     string `json:"judul"`
		Konten    string `json:"konten"`
		Gambar    string `json:"gambar"`
		Penulis   string `json:"penulis"`
		Kategori  string `json:"kategori"`
		CreatedAt string `json:"created_at"`
	}
	list := []Berita{}
	for rows.Next() {
		var b Berita
		rows.Scan(&b.ID, &b.Judul, &b.Konten, &b.Gambar, &b.Penulis, &b.Kategori, &b.CreatedAt)
		list = append(list, b)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

func getBeritaDetail(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	type Berita struct {
		ID        int    `json:"id"`
		Judul     string `json:"judul"`
		Konten    string `json:"konten"`
		Gambar    string `json:"gambar"`
		Penulis   string `json:"penulis"`
		Kategori  string `json:"kategori"`
		CreatedAt string `json:"created_at"`
	}
	var b Berita
	err := db.QueryRow(`SELECT id, judul, konten, COALESCE(gambar,''), COALESCE(penulis,''),
		COALESCE(kategori,'berita'), TO_CHAR(created_at,'YYYY-MM-DD')
		FROM lp_berita WHERE id=$1`, id).Scan(&b.ID, &b.Judul, &b.Konten, &b.Gambar, &b.Penulis, &b.Kategori, &b.CreatedAt)
	if err != nil {
		jsonError(w, "Berita tidak ditemukan", 404)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(b)
}

func createBerita(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		jsonError(w, "Parse error: "+err.Error(), 400)
		return
	}
	judul := strings.TrimSpace(r.FormValue("judul"))
	konten := strings.TrimSpace(r.FormValue("konten"))
	penulis := r.FormValue("penulis")
	kategori := r.FormValue("kategori")
	published := r.FormValue("published") == "true"

	if kategori == "" {
		kategori = "berita"
	}
	log.Printf("CREATE berita kategori=%s judul=%s", kategori, judul)

	if judul == "" || konten == "" {
		jsonError(w, "Judul dan konten wajib diisi", 400)
		return
	}

	gambarPath := ""
	file, handler, err := r.FormFile("gambar")
	if err == nil {
		defer file.Close()
		os.MkdirAll("uploads", os.ModePerm)
		ext := filepath.Ext(handler.Filename)
		filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
		gambarPath = "uploads/" + filename
		dst, err := os.Create(gambarPath)
		if err == nil {
			defer dst.Close()
			io.Copy(dst, file)
		}
	}

	var id int
	err = db.QueryRow(`INSERT INTO lp_berita (judul,konten,gambar,penulis,kategori,published) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
		judul, konten, gambarPath, penulis, kategori, published).Scan(&id)
	if err != nil {
		jsonError(w, "Gagal: "+err.Error(), 500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(201)
	json.NewEncoder(w).Encode(map[string]interface{}{"id": id, "message": "Berita created"})
}

func updateBerita(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		jsonError(w, "Parse error: "+err.Error(), 400)
		return
	}
	judul := strings.TrimSpace(r.FormValue("judul"))
	konten := strings.TrimSpace(r.FormValue("konten"))
	penulis := r.FormValue("penulis")
	kategori := r.FormValue("kategori")
	published := r.FormValue("published") == "true"

	if kategori == "" {
		kategori = "berita"
	}
	log.Printf("UPDATE berita id=%s kategori=%s", id, kategori)

	gambarPath := ""
	file, handler, err := r.FormFile("gambar")
	if err == nil {
		defer file.Close()
		os.MkdirAll("uploads", os.ModePerm)
		ext := filepath.Ext(handler.Filename)
		filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
		gambarPath = "uploads/" + filename
		dst, err := os.Create(gambarPath)
		if err == nil {
			defer dst.Close()
			io.Copy(dst, file)
		}
	}

	if gambarPath != "" {
		db.Exec(`UPDATE lp_berita SET judul=$1, konten=$2, gambar=$3, penulis=$4, kategori=$5, published=$6 WHERE id=$7`,
			judul, konten, gambarPath, penulis, kategori, published, id)
	} else {
		db.Exec(`UPDATE lp_berita SET judul=$1, konten=$2, penulis=$3, kategori=$4, published=$5 WHERE id=$6`,
			judul, konten, penulis, kategori, published, id)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Berita updated"})
}

func deleteBerita(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	var gambar string
	db.QueryRow("SELECT COALESCE(gambar,'') FROM lp_berita WHERE id=$1", id).Scan(&gambar)
	if gambar != "" {
		os.Remove(gambar)
	}
	db.Exec(`DELETE FROM lp_berita WHERE id=$1`, id)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Berita deleted"})
}

func jsonError(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
