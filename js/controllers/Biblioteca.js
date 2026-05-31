/**
 * Controlador Biblioteca - CRUD completo con persistencia localStorage
 * Semana 16 - Biblioteca Escolar
 */
class Biblioteca {
    #libros;
    #contadorId;
    #STORAGE_KEY = 'biblioteca_libros';
    #COUNTER_KEY = 'biblioteca_contador';

    constructor() {
        this.#libros = [];
        this.#contadorId = 1;
        this.#cargarDesdeStorage();
    }

    // ===== PERSISTENCIA =====
    #cargarDesdeStorage() {
        try {
            const raw = localStorage.getItem(this.#STORAGE_KEY);
            const contador = localStorage.getItem(this.#COUNTER_KEY);
            if (raw) {
                const datos = JSON.parse(raw);
                this.#libros = datos.map(d => Libro.fromJSON(d));
                this.#contadorId = contador ? parseInt(contador) : this.#libros.length + 1;
            } else {
                this.#cargarCatalogoInicial();
            }
        } catch (e) {
            console.error('Error cargando localStorage:', e);
            this.#cargarCatalogoInicial();
        }
    }

    #guardarEnStorage() {
        try {
            localStorage.setItem(this.#STORAGE_KEY, JSON.stringify(this.#libros.map(l => l.toJSON())));
            localStorage.setItem(this.#COUNTER_KEY, String(this.#contadorId));
        } catch (e) {
            console.error('Error guardando en localStorage:', e);
        }
    }

    #cargarCatalogoInicial() {
        const semilla = [
            ["El Quijote", "Miguel de Cervantes", 1605, "978-84-376-0494-7", "Novela", 2],
            ["Cien años de soledad", "Gabriel García Márquez", 1967, "978-84-397-0007-0", "Novela", 3],
            ["La sombra del viento", "Carlos Ruiz Zafón", 2001, "978-84-08-05341-7", "Novela", 2],
            ["El Principito", "Antoine de Saint-Exupéry", 1943, "978-84-6644-778-3", "Infantil", 4],
            ["Breve historia del tiempo", "Stephen Hawking", 1988, "978-84-08-03983-1", "Ciencia", 2],
            ["Sapiens", "Yuval Noah Harari", 2011, "978-84-9992-376-5", "Historia", 2],
            ["La chica del tren", "Paula Hawkins", 2015, "978-84-663-2964-5", "Novela", 1],
            ["Veinte poemas de amor", "Pablo Neruda", 1924, "978-84-206-8285-4", "Poesía", 2]
        ];
        semilla.forEach(([titulo, autor, anio, isbn, genero, copias]) => {
            this.agregarLibro(titulo, autor, anio, isbn, genero, copias);
        });
        // Marcar algunos como prestados inicialmente para demo
        this.#libros[2].prestar();
        this.#libros[6].prestar();
        this.#guardarEnStorage();
    }

    // ===== CRUD =====
    agregarLibro(titulo, autor, anio, isbn = '', genero = 'Otro', copias = 1) {
        const libro = new Libro(this.#contadorId++, titulo.trim(), autor.trim(), anio, isbn.trim(), genero, copias);
        this.#libros.push(libro);
        this.#guardarEnStorage();
        return libro;
    }

    editarLibro(id, datos) {
        const libro = this.buscarPorId(id);
        if (!libro) return false;
        if (datos.titulo) libro.setTitulo(datos.titulo);
        if (datos.autor)  libro.setAutor(datos.autor);
        if (datos.anio)   libro.setAnio(datos.anio);
        if (datos.isbn !== undefined) libro.setISBN(datos.isbn);
        if (datos.genero) libro.setGenero(datos.genero);
        if (datos.copias) libro.setCopias(datos.copias);
        this.#guardarEnStorage();
        return true;
    }

    eliminarLibro(id) {
        const idx = this.#libros.findIndex(l => l.getId() === id);
        if (idx === -1) return false;
        this.#libros.splice(idx, 1);
        this.#guardarEnStorage();
        return true;
    }

    // ===== CONSULTAS =====
    listarLibros()      { return [...this.#libros]; }
    buscarPorId(id)     { return this.#libros.find(l => l.getId() === id) || null; }

    filtrar({ texto = '', disponibilidad = 'all', genero = 'all', anioMin = 0, anioMax = 9999 } = {}) {
        const t = texto.toLowerCase();
        return this.#libros.filter(l => {
            const matchTexto = !t || l.getTitulo().toLowerCase().includes(t) ||
                               l.getAutor().toLowerCase().includes(t) ||
                               l.getISBN().includes(t);
            const matchDisp = disponibilidad === 'all' ||
                              (disponibilidad === 'available' && l.isDisponible()) ||
                              (disponibilidad === 'borrowed' && !l.isDisponible());
            const matchGenero = genero === 'all' || l.getGenero() === genero;
            const matchAnio = l.getAnio() >= anioMin && l.getAnio() <= anioMax;
            return matchTexto && matchDisp && matchGenero && matchAnio;
        });
    }

    // Llamado por PrestamoController al prestar/devolver
    procesarPrestamo(libroId)   {
        const l = this.buscarPorId(libroId);
        if (!l) return false;
        const ok = l.prestar();
        if (ok) this.#guardarEnStorage();
        return ok;
    }

    procesarDevolucion(libroId) {
        const l = this.buscarPorId(libroId);
        if (!l) return false;
        const ok = l.devolver();
        if (ok) this.#guardarEnStorage();
        return ok;
    }

    // ===== ESTADÍSTICAS =====
    getEstadisticas() {
        const todos = this.#libros;
        const total = todos.length;
        const disponibles = todos.filter(l => l.isDisponible()).length;
        const prestados = total - disponibles;

        const porGenero = {};
        const porDecada = {};
        todos.forEach(l => {
            porGenero[l.getGenero()] = (porGenero[l.getGenero()] || 0) + 1;
            const dec = Math.floor(l.getAnio() / 10) * 10;
            porDecada[dec] = (porDecada[dec] || 0) + 1;
        });

        return { total, disponibles, prestados, porGenero, porDecada };
    }
}
