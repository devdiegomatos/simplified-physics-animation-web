# Simplified Physics Simulation on the Web

This repository contains the final paper for a Bachelor's degree in Computer Science at the Federal University of Rio de Janeiro. It features an implementation of Position-Based Projection using Jakobsen's method and a 2D physics engine rendered with P5.js.

The physics engine can run in two modes:

* **SAT-based mode:** Powered by the Separating Axis Theorem (SAT) for collision detection. Collision resolution is handled by Jakobsen's method after calculating the Minimum Translation Vector (MTV) and correctly projecting the points/particles. This works very well in 2D.
* **GJK/EPA-based mode:** Powered by the Gilbert–Johnson–Keerthi (GJK) algorithm for collision detection and the Expanding Polytope Algorithm (EPA) for calculating the MTV. Collision resolution is then performed in the same way as in SAT mode. This works very well in both 2D and 3D.

---

## 📁 Repository Structure

```
.
├── final-paper/     # LaTeX source for the academic paper
├── homepage/        # Vue.js demo site using the local physics engine
└── package/         # Physics engine library (TypeScript + Vite)

```

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/diegomatos321/simplified-physics-simulation-web.git
cd simplified-physics-simulation-web
```

### 2. Install Dependencies

You must install dependencies separately for the **library** (`package/`) and the **demo site** (`homepage/`).

#### For the physics engine library:

```bash
cd package
npm install
npm run build
```

This will compile the TypeScript source into a local distributable package located in `package/dist`.

#### For the homepage project:

```bash
cd homepage
npm install
```

To link the local physics library so that `homepage` uses the local implementation instead of a published version:

```bash
npm link ../package
```

---

## 🚀 Running the Demo

After linking the library and installing dependencies, start the Vue.js demo at homepage folder:

```bash
npm run dev
```

Then open the provided local URL (usually `http://localhost:5173`) in your browser.

This homepage demonstrates examples from the monograph using the locally implemented physics engine.

---

## 🧪 Development Workflow

* **Edit the library:** Modify files inside `package/src/`.
* **Rebuild the library:**

  ```bash
  cd package
  npm run build
  ```
* **Reload the homepage:** The Vue app will automatically detect changes if running in dev mode.

---

## 🧩 Technologies Used

* **TypeScript** – Core language for the physics engine.
* **Vite** – Fast build tool for library development.
* **Vue 3** – Frontend framework for the demo.
* **TailwindCSS** – Utility-first CSS framework for styling.
* **P5** – p5.js is a friendly tool for learning to code and make art. It is a free and open-source JavaScript library built by an inclusive, nurturing community.

## Complementary Resources

[MURATORI, C. Implementing GJK, 2006](https://caseymuratori.com/blog_0003)
[Winter Dev, GJK Algorithm Explanation & Implementation, 2021](https://www.youtube.com/watch?v=MDusDn8oTSE)
[Winter Dev, EPA Explanation & Implementation, 2021](https://www.youtube.com/watch?v=0XQ2FSz3EK8)
[dyn4j, GJK (Gilbert–Johnson–Keerthi), 2010](https://dyn4j.org/2010/04/gjk-gilbert-johnson-keerthi/)
[dyn4j, GJK, Distance, Closest Points, 2010](https://dyn4j.org/2010/04/gjk-distance-closest-points/)
[dyn4j, EPA (Expanding Polytope Algorithm, 2010)](https://dyn4j.org/2010/05/epa-expanding-polytope-algorithm/)
[Philip Djonov, GJK, 2012](https://vec3.ca/gjk)
