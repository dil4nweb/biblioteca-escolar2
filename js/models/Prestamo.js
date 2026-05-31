/**
 * Clase Prestamo - Modelo de préstamo
 * Semana 16 - Biblioteca Escolar
 */
class Prestamo {
    #id;
    #libroId;
    #libroTitulo;
    #estudiante;
    #curso;
    #fechaPrestamo;
    #fechaDevolucionEsperada;
    #fechaDevolucionReal;
    #activo;

    constructor(id, libroId, libroTitulo, estudiante, curso, fechaDevolucionEsperada) {
        this.#id = id;
        this.#libroId = libroId;
        this.#libroTitulo = libroTitulo;
        this.#estudiante = estudiante;
        this.#curso = curso;
        this.#fechaPrestamo = new Date().toISOString();
        this.#fechaDevolucionEsperada = fechaDevolucionEsperada;
        this.#fechaDevolucionReal = null;
        this.#activo = true;
    }

    getId()                    { return this.#id; }
    getLibroId()               { return this.#libroId; }
    getLibroTitulo()           { return this.#libroTitulo; }
    getEstudiante()            { return this.#estudiante; }
    getCurso()                 { return this.#curso; }
    getFechaPrestamo()         { return this.#fechaPrestamo; }
    getFechaDevolucionEsperada(){ return this.#fechaDevolucionEsperada; }
    getFechaDevolucionReal()   { return this.#fechaDevolucionReal; }
    isActivo()                 { return this.#activo; }

    isVencido() {
        if (!this.#activo) return false;
        return new Date() > new Date(this.#fechaDevolucionEsperada);
    }

    registrarDevolucion() {
        this.#fechaDevolucionReal = new Date().toISOString();
        this.#activo = false;
    }

    toJSON() {
        return {
            id: this.#id,
            libroId: this.#libroId,
            libroTitulo: this.#libroTitulo,
            estudiante: this.#estudiante,
            curso: this.#curso,
            fechaPrestamo: this.#fechaPrestamo,
            fechaDevolucionEsperada: this.#fechaDevolucionEsperada,
            fechaDevolucionReal: this.#fechaDevolucionReal,
            activo: this.#activo
        };
    }

    static fromJSON(data) {
        const p = new Prestamo(data.id, data.libroId, data.libroTitulo, data.estudiante, data.curso, data.fechaDevolucionEsperada);
        p.#fechaPrestamo = data.fechaPrestamo;
        p.#fechaDevolucionReal = data.fechaDevolucionReal;
        p.#activo = data.activo;
        return p;
    }
}
