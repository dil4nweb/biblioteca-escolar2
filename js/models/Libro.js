/**
 * Clase Libro - Modelo con campos completos
 * Semana 16 - Biblioteca Escolar
 */
class Libro {
    #id;
    #titulo;
    #autor;
    #anio;
    #isbn;
    #genero;
    #copias;
    #copiasDisponibles;
    #fechaRegistro;

    constructor(id, titulo, autor, anio, isbn = '', genero = 'Otro', copias = 1) {
        this.#id = id;
        this.#titulo = titulo;
        this.#autor = autor;
        this.#anio = anio;
        this.#isbn = isbn;
        this.#genero = genero;
        this.#copias = copias;
        this.#copiasDisponibles = copias;
        this.#fechaRegistro = new Date().toISOString();
    }

    // Getters
    getId()               { return this.#id; }
    getTitulo()           { return this.#titulo; }
    getAutor()            { return this.#autor; }
    getAnio()             { return this.#anio; }
    getISBN()             { return this.#isbn; }
    getGenero()           { return this.#genero; }
    getCopias()           { return this.#copias; }
    getCopiasDisponibles(){ return this.#copiasDisponibles; }
    getFechaRegistro()    { return this.#fechaRegistro; }
    isDisponible()        { return this.#copiasDisponibles > 0; }

    // Setters controlados
    setTitulo(v)   { if (v && v.trim()) this.#titulo = v.trim(); }
    setAutor(v)    { if (v && v.trim()) this.#autor = v.trim(); }
    setAnio(v)     { if (v >= 1000 && v <= 2026) this.#anio = v; }
    setISBN(v)     { this.#isbn = v; }
    setGenero(v)   { this.#genero = v; }
    setCopias(v)   {
        const diff = v - this.#copias;
        this.#copias = v;
        this.#copiasDisponibles = Math.max(0, this.#copiasDisponibles + diff);
    }

    prestar() {
        if (this.#copiasDisponibles > 0) { this.#copiasDisponibles--; return true; }
        return false;
    }

    devolver() {
        if (this.#copiasDisponibles < this.#copias) { this.#copiasDisponibles++; return true; }
        return false;
    }

    // Serializar para localStorage
    toJSON() {
        return {
            id: this.#id,
            titulo: this.#titulo,
            autor: this.#autor,
            anio: this.#anio,
            isbn: this.#isbn,
            genero: this.#genero,
            copias: this.#copias,
            copiasDisponibles: this.#copiasDisponibles,
            fechaRegistro: this.#fechaRegistro
        };
    }

    // Deserializar desde localStorage
    static fromJSON(data) {
        const libro = new Libro(data.id, data.titulo, data.autor, data.anio, data.isbn, data.genero, data.copias);
        libro.#copiasDisponibles = data.copiasDisponibles;
        libro.#fechaRegistro = data.fechaRegistro;
        return libro;
    }
}
