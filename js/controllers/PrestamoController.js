/**
 * Controlador de Préstamos - Gestión completa con localStorage
 * Semana 16 - Biblioteca Escolar
 */
class PrestamoController {
    #prestamos;
    #contadorId;
    #STORAGE_KEY = 'biblioteca_prestamos';
    #COUNTER_KEY = 'biblioteca_prestamos_contador';

    constructor() {
        this.#prestamos = [];
        this.#contadorId = 1;
        this.#cargarDesdeStorage();
    }

    #cargarDesdeStorage() {
        try {
            const raw = localStorage.getItem(this.#STORAGE_KEY);
            const contador = localStorage.getItem(this.#COUNTER_KEY);
            if (raw) {
                this.#prestamos = JSON.parse(raw).map(d => Prestamo.fromJSON(d));
                this.#contadorId = contador ? parseInt(contador) : this.#prestamos.length + 1;
            }
        } catch (e) {
            console.error('Error cargando préstamos:', e);
        }
    }

    #guardarEnStorage() {
        try {
            localStorage.setItem(this.#STORAGE_KEY, JSON.stringify(this.#prestamos.map(p => p.toJSON())));
            localStorage.setItem(this.#COUNTER_KEY, String(this.#contadorId));
        } catch (e) {
            console.error('Error guardando préstamos:', e);
        }
    }

    registrarPrestamo(libroId, libroTitulo, estudiante, curso, fechaDevolucion) {
        const prestamo = new Prestamo(
            this.#contadorId++,
            libroId, libroTitulo,
            estudiante.trim(), curso.trim(),
            fechaDevolucion
        );
        this.#prestamos.push(prestamo);
        this.#guardarEnStorage();
        return prestamo;
    }

    registrarDevolucion(prestamoId) {
        const prestamo = this.#prestamos.find(p => p.getId() === prestamoId);
        if (!prestamo || !prestamo.isActivo()) return false;
        prestamo.registrarDevolucion();
        this.#guardarEnStorage();
        return true;
    }

    listarActivos()   { return this.#prestamos.filter(p => p.isActivo()); }
    listarTodos()     { return [...this.#prestamos]; }
    listarVencidos()  { return this.#prestamos.filter(p => p.isVencido()); }

    getPorLibro(libroId) {
        return this.#prestamos.filter(p => p.getLibroId() === libroId && p.isActivo());
    }

    getHistorialSemanas(n = 8) {
        const ahora = new Date();
        const semanas = [];
        for (let i = n - 1; i >= 0; i--) {
            const inicio = new Date(ahora);
            inicio.setDate(ahora.getDate() - (i + 1) * 7);
            const fin = new Date(ahora);
            fin.setDate(ahora.getDate() - i * 7);
            const count = this.#prestamos.filter(p => {
                const fp = new Date(p.getFechaPrestamo());
                return fp >= inicio && fp < fin;
            }).length;
            semanas.push({ label: `S-${i === 0 ? 'actual' : i}`, count });
        }
        return semanas;
    }

    getEstadisticas() {
        const activos = this.listarActivos().length;
        const vencidos = this.listarVencidos().length;
        const total = this.#prestamos.length;
        const devueltos = total - activos;
        return { activos, vencidos, total, devueltos };
    }
}
