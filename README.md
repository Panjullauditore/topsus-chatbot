# topsus-chatbot 🤖

Sistem chatbot berbasis AI yang dikembangkan untuk membantu pengguna mendapatkan informasi secara otomatis melalui percakapan. Project ini mengintegrasikan beberapa teknologi seperti **Rasa**, **Retrieval Augmented Generation (RAG)**, serta **web interface berbasis Next.js**.

## 📌 Deskripsi Project

**topsus-chatbot** merupakan sistem chatbot yang dirancang untuk memberikan respon otomatis terhadap pertanyaan pengguna. Sistem ini terdiri dari beberapa komponen utama yaitu backend API, frontend web interface, serta modul chatbot berbasis Rasa dan RAG.

Chatbot ini mampu:

* Menjawab pertanyaan pengguna secara otomatis
* Mengambil informasi dari knowledge base
* Menyediakan interface chat yang interaktif
* Mengelola data pengetahuan melalui halaman admin

---

## 🏗️ Arsitektur Sistem

Project ini terdiri dari beberapa komponen utama:

```
topsus-chatbot
│
├── backend        # API backend untuk mengelola data dan komunikasi sistem
├── frontend       # Web interface chatbot berbasis Next.js
├── rag-bot        # Modul chatbot menggunakan Retrieval Augmented Generation
├── rasa-bot       # Chatbot engine menggunakan Rasa
└── start_all.bat  # Script untuk menjalankan semua layanan sekaligus
```

---

## 🛠️ Teknologi yang Digunakan

Beberapa teknologi yang digunakan dalam project ini:

* **Next.js / React** → Frontend interface chatbot
* **Python** → Backend API dan integrasi chatbot
* **Rasa** → Natural Language Understanding (NLU) chatbot
* **RAG (Retrieval Augmented Generation)** → Pengambilan informasi dari knowledge base
* **TypeScript** → Pengembangan frontend
* **CSS** → Styling tampilan web

---

## ⚙️ Cara Menjalankan Project

### 1️⃣ Clone Repository

```bash
git clone https://github.com/Panjullauditore/topsus-chatbot.git
```

### 2️⃣ Masuk ke Folder Project

```bash
cd topsus-chatbot
```

### 3️⃣ Jalankan Sistem

Untuk menjalankan semua layanan sekaligus, gunakan:

```
start_all.bat
```

Script ini akan menjalankan:

* backend server
* frontend interface
* Rasa chatbot
* RAG service

---

## 💬 Fitur Utama

* Chatbot berbasis AI
* Sistem knowledge base
* Halaman admin untuk pengelolaan data
* Integrasi Rasa NLU
* Sistem respon berbasis RAG
* Interface chat interaktif

---

## 👨‍💻 Author

**Panjullauditore Rezz**

GitHub:
https://github.com/Panjullauditore

---

## 📄 License

Project ini dibuat untuk keperluan pembelajaran dan pengembangan sistem chatbot.
