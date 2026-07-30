<div align="center">

  # 🛠️ Cachito ERP
  **Sistema de Gestión Desktop Local para Ferreterías & Comercio**

  [![Tauri](https://img.shields.io/badge/Tauri-v2.0-blue?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app/)
  [![Rust](https://img.shields.io/badge/Rust-Backend-orange?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
  [![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
  [![SQLite](https://img.shields.io/badge/SQLite-Local_DB-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

  *Aplicación de escritorio ultra ligera, moderna y offline-first diseñada para el control total de inventario, ventas rápidas en mostrador y facturación.*

</div>

---

## 📌 Sobre el Proyecto

**Cachito** es una solución ERP desktop de alto rendimiento desarrollada bajo una **arquitectura por capas / vertical slice**, combinando la seguridad y velocidad del lenguaje Rust en el backend con una interfaz fluida e intuitiva construida en React.

A diferencia de los sistemas tradicionales pesados o basados en la nube con suscripciones mensuales, Cachito opera **100% de manera local (Offline-First)** sobre una base de datos SQLite persistente, garantizando cero latencia en caja y privacidad total de los datos comerciales.

---

## ⚡ Características Principales

- 📦 **Control de Inventario Express:** Búsqueda ultrarrápida por código de barras o descripción con tolerancia a errores tipográficos.
- 💻 **Offline-First:** Persistencia local en SQLite con migraciones automáticas (`sqlx`), ideal para operar sin interrupciones de internet.
- 🎨 **Interfaz ERP Moderna:** UI profesional construida con `shadcn/ui` y Tailwind CSS v4, optimizada para uso intensivo de teclado.
- 🚀 **Rendimiento Excepcional:** Consumo mínimo de memoria RAM (~30-50 MB) gracias al motor de Tauri v2.
- 🧾 **Próximamente - Facturación Integrada:** Módulo de facturación electrónica directa con ARCA / AFIP.

---

## 💻 Stack Tecnológico

| Capa | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Backend** | Rust + Tauri v2 | Lógica de negocio, comandos nativos y comunicación con el SO |
| **Persistencia** | SQLite + `sqlx` | Base de datos relacional local con tipos estáticos en tiempo de compilación |
| **Frontend** | React + TypeScript | Interfaz de usuario declarativa con tipado estricto |
| **Estilos & UI** | Tailwind CSS v4 + `shadcn/ui` | Diseño limpio, accesible y responsivo |
| **Bundler** | Vite | Entorno de desarrollo rápido y HMR instantáneo |

---

## 🏗️ Arquitectura del Sistema

El proyecto sigue un patrón de **Vertical Slices / Capas Clarificadas** en Rust para garantizar la mantenibilidad y escalabilidad del código:

```text
src-tauri/src/
├── commands/     # Handlers expuestos hacia el frontend (Tauri IPC)
├── services/     # Reglas de negocio y orquestación
├── repositories/ # Consultas SQL y acceso a SQLite via sqlx
├── models/       # DTOs y estructuras de datos compartidas
└── migrations/   # Control de versiones del esquema de la base de datos

## 🛠️ Requisitos Previos

Asegúrate de contar con el entorno de desarrollo configurado:

1. **Node.js** (v18 o superior) y **npm**
2. **Rust & Cargo** (Instalado mediante [rustup.rs](https://rustup.rs/))
3. Dependencias nativas de Tauri para tu SO (Ver [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/))
```
---

## 🚀 Instalación y Ejecución

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/almaranteManuel/cachito.git](https://github.com/almaranteManuel/cachito.git)
   cd cachito

2. **Instalar dependencias del frontend:**
   ```bash
   npm install

3. **Iniciar en modo desarrollo (Tauri + React + Rust):**
   ```bash
   npm run tauri dev

4. ***Compilar para producción (Generar instalador executable):**
   ```bash
   npm run tauri build

## 📋 Scripts Disponibles
npm run dev — Inicia únicamente el servidor de desarrollo Vite (Frontend UI).

npm run build — Compila y valida los tipos de TypeScript en el Frontend.

npm run tauri dev — Levanta la aplicación completa conectando Rust con React.

npm run tauri build — Genera el instalador binario listo para distribución (.msi, .exe, .deb, etc.).

## 👤 Autor
Manuel Almarante

Desarrollador Full-Stack

🐙 GitHub: https://github.com/almaranteManuel

💼 LinkedIn: https://www.linkedin.com/in/almarantemanuel/

✉️ Email: almarante.manu@gmail.com
