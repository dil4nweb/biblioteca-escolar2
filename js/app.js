/**
 * App Principal - Orquesta UI y controladores
 * Semana 16 - Biblioteca Escolar
 */
class AppBiblioteca {
    constructor() {
        this.biblioteca       = new Biblioteca();
        this.prestamoCtrl     = new PrestamoController();
        this.graficos         = {};
        this.libroIdAEliminar = null;

        this.#init();
    }

    #init() {
        this.#renderCatalogo();
        this.#renderPrestamos();
        this.#renderEstadisticas();
        this.#bindFiltros();
        this.#bindModales();
        this.#setFechaDefaultPrestamo();
    }

    // =========================================================
    // CATÁLOGO
    // =========================================================
    #getFiltrosActuales() {
        return {
            texto:         document.getElementById('searchFilter').value,
            disponibilidad:document.getElementById('availabilityFilter').value,
            genero:        document.getElementById('genreFilter').value,
            anioMin:       parseInt(document.getElementById('yearMin').value)  || 0,
            anioMax:       parseInt(document.getElementById('yearMax').value)  || 9999
        };
    }

    #renderCatalogo(filtros = null) {
        const libros = filtros
            ? this.biblioteca.filtrar(filtros)
            : this.biblioteca.filtrar();

        const contenedor = document.getElementById('cardsContainer');
        const contador   = document.getElementById('contadorResultados');
        const total      = this.biblioteca.listarLibros().length;

        contador.textContent = `${libros.length} de ${total} libros`;

        if (libros.length === 0) {
            contenedor.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="bi bi-search"></i>
                        <p>No se encontraron libros con esos criterios.</p>
                    </div>
                </div>`;
            return;
        }

        contenedor.innerHTML = '';
        libros.forEach((libro, idx) => {
            const prestamosActivos = this.prestamoCtrl.getPorLibro(libro.getId());
            const col = document.createElement('div');
            col.className = 'col-12 col-sm-6 col-lg-4 col-xl-3';
            col.style.animationDelay = `${idx * 0.05}s`;

            const estadoBadge = libro.isDisponible()
                ? `<span class="badge-estado badge-disponible"><i class="bi bi-check-circle me-1"></i>Disponible (${libro.getCopiasDisponibles()}/${libro.getCopias()})</span>`
                : `<span class="badge-estado badge-prestado"><i class="bi bi-clock me-1"></i>Prestado</span>`;

            const btnPrestar  = libro.isDisponible()
                ? `<button class="btn-accion btn-prestar" data-id="${libro.getId()}" data-titulo="${this.#esc(libro.getTitulo())}"><i class="bi bi-box-arrow-right me-1"></i>Prestar</button>`
                : '';

            const btnDevolver = prestamosActivos.length > 0
                ? `<button class="btn-accion btn-devolver" data-prestamo-id="${prestamosActivos[0].getId()}" data-libro-id="${libro.getId()}"><i class="bi bi-box-arrow-in-left me-1"></i>Devolver</button>`
                : '';

            col.innerHTML = `
                <div class="libro-card">
                    <div class="libro-card-header">
                        <span class="libro-genero-tag">${this.#esc(libro.getGenero())}</span>
                        <h3 class="libro-titulo">${this.#esc(libro.getTitulo())}</h3>
                    </div>
                    <div class="libro-card-body">
                        <p class="libro-meta"><strong>Autor:</strong> ${this.#esc(libro.getAutor())}</p>
                        <p class="libro-meta"><strong>Año:</strong> ${libro.getAnio()}</p>
                        ${libro.getISBN() ? `<p class="libro-meta"><strong>ISBN:</strong> ${this.#esc(libro.getISBN())}</p>` : ''}
                        <div class="mt-2">${estadoBadge}</div>
                    </div>
                    <div class="libro-card-footer">
                        ${btnPrestar}
                        ${btnDevolver}
                        <button class="btn-accion btn-editar" data-id="${libro.getId()}"><i class="bi bi-pencil me-1"></i>Editar</button>
                        <button class="btn-accion btn-eliminar" data-id="${libro.getId()}" data-titulo="${this.#esc(libro.getTitulo())}"><i class="bi bi-trash me-1"></i></button>
                    </div>
                </div>`;
            contenedor.appendChild(col);
        });

        this.#bindBotonesCards();
        this.#actualizarHeroStats();
    }

    #bindBotonesCards() {
        document.querySelectorAll('.btn-prestar').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('prestamoLibroId').value    = btn.dataset.id;
                document.getElementById('prestamoLibroTitulo').textContent = btn.dataset.titulo;
                new bootstrap.Modal(document.getElementById('modalPrestamo')).show();
            });
        });

        document.querySelectorAll('.btn-devolver').forEach(btn => {
            btn.addEventListener('click', () => {
                const ok = this.prestamoCtrl.registrarDevolucion(parseInt(btn.dataset.prestamoId));
                if (ok) {
                    this.biblioteca.procesarDevolucion(parseInt(btn.dataset.libroId));
                    this.#renderAll();
                    this.#mostrarAlerta('Devolución registrada correctamente.', 'success');
                }
            });
        });

        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', () => this.#abrirModalEditar(parseInt(btn.dataset.id)));
        });

        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', () => {
                this.libroIdAEliminar = parseInt(btn.dataset.id);
                document.getElementById('eliminarLibroTitulo').textContent = btn.dataset.titulo;
                new bootstrap.Modal(document.getElementById('modalEliminar')).show();
            });
        });
    }

    // =========================================================
    // PRÉSTAMOS
    // =========================================================
    #renderPrestamos() {
        const contenedor = document.getElementById('prestamosContainer');
        const activos = this.prestamoCtrl.listarActivos();

        if (activos.length === 0) {
            contenedor.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="bi bi-inbox"></i>
                        <p>No hay préstamos activos en este momento.</p>
                    </div>
                </div>`;
            return;
        }

        contenedor.innerHTML = '';
        activos.forEach((p, idx) => {
            const vencido = p.isVencido();
            const col = document.createElement('div');
            col.className = 'col-12 col-md-6 col-xl-4';
            col.style.animationDelay = `${idx * 0.05}s`;

            const fechaE = new Date(p.getFechaDevolucionEsperada());
            const fechaP = new Date(p.getFechaPrestamo());

            col.innerHTML = `
                <div class="prestamo-card ${vencido ? 'vencido' : ''}">
                    <div class="prestamo-info">
                        <div class="prestamo-libro">${this.#esc(p.getLibroTitulo())}</div>
                        <div class="prestamo-estudiante"><i class="bi bi-person me-1"></i>${this.#esc(p.getEstudiante())}${p.getCurso() ? ` &mdash; ${this.#esc(p.getCurso())}` : ''}</div>
                        <div class="prestamo-fecha mt-1">
                            <i class="bi bi-calendar3 me-1"></i>Prestado: ${fechaP.toLocaleDateString('es-CO')}
                            &nbsp;|&nbsp;
                            <i class="bi bi-calendar-x me-1"></i>Devolver: <strong class="${vencido ? 'text-danger' : ''}">${fechaE.toLocaleDateString('es-CO')}</strong>
                            ${vencido ? ' <span class="badge-estado badge-vencido ms-1">Vencido</span>' : ''}
                        </div>
                    </div>
                    <button class="btn-accion btn-devolver ms-2" 
                            data-prestamo-id="${p.getId()}" 
                            data-libro-id="${p.getLibroId()}">
                        <i class="bi bi-box-arrow-in-left me-1"></i>Devolver
                    </button>
                </div>`;
            contenedor.appendChild(col);
        });

        // Reutilizamos el mismo bind
        contenedor.querySelectorAll('.btn-devolver').forEach(btn => {
            btn.addEventListener('click', () => {
                const ok = this.prestamoCtrl.registrarDevolucion(parseInt(btn.dataset.prestamoId));
                if (ok) {
                    this.biblioteca.procesarDevolucion(parseInt(btn.dataset.libroId));
                    this.#renderAll();
                    this.#mostrarAlerta('Devolución registrada correctamente.', 'success');
                }
            });
        });
    }

    // =========================================================
    // ESTADÍSTICAS Y GRÁFICAS
    // =========================================================
    #renderEstadisticas() {
        const estLib  = this.biblioteca.getEstadisticas();
        const estPres = this.prestamoCtrl.getEstadisticas();

        // Stat cards
        document.getElementById('statsCards').innerHTML = `
            <div class="col-6 col-sm-4 col-lg-2">
                <div class="stat-card">
                    <div class="stat-icon gold"><i class="bi bi-book"></i></div>
                    <div><div class="stat-value">${estLib.total}</div><div class="stat-label">Libros</div></div>
                </div>
            </div>
            <div class="col-6 col-sm-4 col-lg-2">
                <div class="stat-card">
                    <div class="stat-icon green"><i class="bi bi-check-circle"></i></div>
                    <div><div class="stat-value">${estLib.disponibles}</div><div class="stat-label">Disponibles</div></div>
                </div>
            </div>
            <div class="col-6 col-sm-4 col-lg-2">
                <div class="stat-card">
                    <div class="stat-icon orange"><i class="bi bi-arrow-right-circle"></i></div>
                    <div><div class="stat-value">${estPres.activos}</div><div class="stat-label">Prestados</div></div>
                </div>
            </div>
            <div class="col-6 col-sm-4 col-lg-2">
                <div class="stat-card">
                    <div class="stat-icon red"><i class="bi bi-exclamation-circle"></i></div>
                    <div><div class="stat-value">${estPres.vencidos}</div><div class="stat-label">Vencidos</div></div>
                </div>
            </div>
            <div class="col-6 col-sm-4 col-lg-2">
                <div class="stat-card">
                    <div class="stat-icon teal"><i class="bi bi-arrow-return-left"></i></div>
                    <div><div class="stat-value">${estPres.devueltos}</div><div class="stat-label">Devueltos</div></div>
                </div>
            </div>
            <div class="col-6 col-sm-4 col-lg-2">
                <div class="stat-card">
                    <div class="stat-icon gold"><i class="bi bi-activity"></i></div>
                    <div><div class="stat-value">${estPres.total}</div><div class="stat-label">Total Prést.</div></div>
                </div>
            </div>
        `;

        this.#renderGraficas(estLib);
    }

    #renderGraficas(estLib) {
        const colores = ['#f0a500','#3ecfcf','#e05c7a','#2ecc71','#3498db','#9b59b6','#e67e22'];
        const defaults = {
            color: '#eef0f8',
            gridColor: 'rgba(255,255,255,0.06)',
            tickColor: '#8b90a7'
        };

        const destroyChart = (key) => {
            if (this.graficos[key]) { this.graficos[key].destroy(); delete this.graficos[key]; }
        };

        // Décadas
        destroyChart('decadas');
        const decadas = estLib.porDecada;
        this.graficos['decadas'] = new Chart(
            document.getElementById('chartDecadas').getContext('2d'),
            {
                type: 'bar',
                data: {
                    labels: Object.keys(decadas).sort().map(d => `${d}s`),
                    datasets: [{ label: 'Libros', data: Object.keys(decadas).sort().map(k => decadas[k]),
                        backgroundColor: colores[0] + 'cc', borderColor: colores[0], borderWidth: 1, borderRadius: 6 }]
                },
                options: this.#chartOptions(defaults, 'Libros por publicación')
            }
        );

        // Disponibilidad (doughnut)
        destroyChart('disponibilidad');
        this.graficos['disponibilidad'] = new Chart(
            document.getElementById('chartDisponibilidad').getContext('2d'),
            {
                type: 'doughnut',
                data: {
                    labels: ['Disponibles', 'Prestados'],
                    datasets: [{ data: [estLib.disponibles, estLib.prestados],
                        backgroundColor: [colores[3] + 'cc', colores[0] + 'cc'],
                        borderColor: [colores[3], colores[0]], borderWidth: 2 }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: defaults.tickColor, font: { size: 12 } } } }
                }
            }
        );

        // Géneros
        destroyChart('generos');
        const generos = estLib.porGenero;
        this.graficos['generos'] = new Chart(
            document.getElementById('chartGeneros').getContext('2d'),
            {
                type: 'bar',
                data: {
                    labels: Object.keys(generos),
                    datasets: [{ label: 'Libros', data: Object.values(generos),
                        backgroundColor: colores.map(c => c + 'cc'),
                        borderColor: colores, borderWidth: 1, borderRadius: 6 }]
                },
                options: this.#chartOptions(defaults, 'Libros por género')
            }
        );

        // Historial
        destroyChart('historial');
        const hist = this.prestamoCtrl.getHistorialSemanas(8);
        this.graficos['historial'] = new Chart(
            document.getElementById('chartHistorial').getContext('2d'),
            {
                type: 'line',
                data: {
                    labels: hist.map(h => h.label),
                    datasets: [{ label: 'Préstamos', data: hist.map(h => h.count),
                        borderColor: colores[1], backgroundColor: colores[1] + '22',
                        tension: 0.4, fill: true, pointBackgroundColor: colores[1], pointRadius: 4 }]
                },
                options: this.#chartOptions(defaults, 'Actividad reciente')
            }
        );
    }

    #chartOptions(d, title) {
        return {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: false }
            },
            scales: {
                x: { ticks: { color: d.tickColor, font: { size: 11 } }, grid: { color: d.gridColor } },
                y: { ticks: { color: d.tickColor, font: { size: 11 }, stepSize: 1 }, grid: { color: d.gridColor }, beginAtZero: true }
            }
        };
    }

    #actualizarHeroStats() {
        const estLib  = this.biblioteca.getEstadisticas();
        const estPres = this.prestamoCtrl.getEstadisticas();
        document.getElementById('heroTotal').textContent       = estLib.total;
        document.getElementById('heroDisponibles').textContent = estLib.disponibles;
        document.getElementById('heroPrestados').textContent   = estPres.activos;
        document.getElementById('heroVencidos').textContent    = estPres.vencidos;
    }

    // =========================================================
    // MODALES
    // =========================================================
    #bindModales() {
        // Guardar libro (agregar o editar)
        document.getElementById('btnGuardarLibro').addEventListener('click', () => this.#guardarLibro());

        // Confirmar préstamo
        document.getElementById('btnConfirmarPrestamo').addEventListener('click', () => this.#confirmarPrestamo());

        // Confirmar eliminar
        document.getElementById('btnConfirmarEliminar').addEventListener('click', () => {
            if (this.libroIdAEliminar !== null) {
                this.biblioteca.eliminarLibro(this.libroIdAEliminar);
                bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
                this.#renderAll();
                this.#mostrarAlerta('Libro eliminado correctamente.', 'info');
                this.libroIdAEliminar = null;
            }
        });

        // Reset modal al cerrar
        document.getElementById('modalLibro').addEventListener('hidden.bs.modal', () => this.#resetModalLibro());
    }

    #guardarLibro() {
        const titulo  = document.getElementById('inputTitulo').value.trim();
        const autor   = document.getElementById('inputAutor').value.trim();
        const anio    = parseInt(document.getElementById('inputAnio').value);
        const isbn    = document.getElementById('inputISBN').value.trim();
        const genero  = document.getElementById('inputGenero').value;
        const copias  = parseInt(document.getElementById('inputCopias').value) || 1;
        const idEditar= parseInt(document.getElementById('libroIdEditar').value);

        if (!titulo || !autor) { this.#mostrarAlerta('Título y autor son obligatorios.', 'error'); return; }
        if (!anio || anio < 1000 || anio > 2026) { this.#mostrarAlerta('Ingresa un año válido (1000–2026).', 'error'); return; }

        if (idEditar) {
            this.biblioteca.editarLibro(idEditar, { titulo, autor, anio, isbn, genero, copias });
            this.#mostrarAlerta('Libro actualizado correctamente.', 'success');
        } else {
            this.biblioteca.agregarLibro(titulo, autor, anio, isbn, genero, copias);
            this.#mostrarAlerta(`"${titulo}" agregado al catálogo.`, 'success');
        }

        bootstrap.Modal.getInstance(document.getElementById('modalLibro')).hide();
        this.#renderAll();
    }

    #abrirModalEditar(id) {
        const libro = this.biblioteca.buscarPorId(id);
        if (!libro) return;
        document.getElementById('libroIdEditar').value     = libro.getId();
        document.getElementById('inputTitulo').value       = libro.getTitulo();
        document.getElementById('inputAutor').value        = libro.getAutor();
        document.getElementById('inputAnio').value         = libro.getAnio();
        document.getElementById('inputISBN').value         = libro.getISBN();
        document.getElementById('inputGenero').value       = libro.getGenero();
        document.getElementById('inputCopias').value       = libro.getCopias();
        document.getElementById('modalLibroLabel').innerHTML = '<i class="bi bi-pencil me-2"></i>Editar Libro';
        new bootstrap.Modal(document.getElementById('modalLibro')).show();
    }

    #resetModalLibro() {
        document.getElementById('libroIdEditar').value = '';
        document.getElementById('inputTitulo').value   = '';
        document.getElementById('inputAutor').value    = '';
        document.getElementById('inputAnio').value     = '';
        document.getElementById('inputISBN').value     = '';
        document.getElementById('inputGenero').value   = 'Novela';
        document.getElementById('inputCopias').value   = '1';
        document.getElementById('modalLibroLabel').innerHTML = '<i class="bi bi-book me-2"></i>Nuevo Libro';
    }

    #confirmarPrestamo() {
        const libroId    = parseInt(document.getElementById('prestamoLibroId').value);
        const titulo     = document.getElementById('prestamoLibroTitulo').textContent;
        const estudiante = document.getElementById('inputEstudiante').value.trim();
        const curso      = document.getElementById('inputCurso').value.trim();
        const fecha      = document.getElementById('inputFechaDevolucion').value;

        if (!estudiante) { this.#mostrarAlerta('El nombre del estudiante es obligatorio.', 'error'); return; }
        if (!fecha)      { this.#mostrarAlerta('La fecha de devolución es obligatoria.', 'error'); return; }

        const ok = this.biblioteca.procesarPrestamo(libroId);
        if (!ok) { this.#mostrarAlerta('No hay copias disponibles.', 'error'); return; }

        this.prestamoCtrl.registrarPrestamo(libroId, titulo, estudiante, curso, fecha);
        bootstrap.Modal.getInstance(document.getElementById('modalPrestamo')).hide();

        // Reset campos préstamo
        document.getElementById('inputEstudiante').value = '';
        document.getElementById('inputCurso').value      = '';
        this.#setFechaDefaultPrestamo();

        this.#renderAll();
        this.#mostrarAlerta(`Préstamo de "${titulo}" registrado para ${estudiante}.`, 'success');
    }

    #setFechaDefaultPrestamo() {
        const d = new Date();
        d.setDate(d.getDate() + 14); // 2 semanas por defecto
        document.getElementById('inputFechaDevolucion').value = d.toISOString().split('T')[0];
    }

    // =========================================================
    // FILTROS
    // =========================================================
    #bindFiltros() {
        ['searchFilter','availabilityFilter','genreFilter','yearMin','yearMax'].forEach(id => {
            document.getElementById(id).addEventListener('input',  () => this.#renderCatalogo(this.#getFiltrosActuales()));
            document.getElementById(id).addEventListener('change', () => this.#renderCatalogo(this.#getFiltrosActuales()));
        });

        document.getElementById('btnLimpiarFiltros').addEventListener('click', () => {
            ['searchFilter','yearMin','yearMax'].forEach(id => document.getElementById(id).value = '');
            document.getElementById('availabilityFilter').value = 'all';
            document.getElementById('genreFilter').value = 'all';
            this.#renderCatalogo();
        });

        // Botón Nuevo Libro desde navbar
        document.getElementById('btnAbrirAgregar').addEventListener('click', () => this.#resetModalLibro());
    }

    // =========================================================
    // HELPERS
    // =========================================================
    #renderAll() {
        this.#renderCatalogo(this.#getFiltrosActuales());
        this.#renderPrestamos();
        this.#renderEstadisticas();
    }

    #esc(str) {
        const d = document.createElement('div');
        d.textContent = str || '';
        return d.innerHTML;
    }

    #mostrarAlerta(mensaje, tipo = 'success') {
        const el = document.getElementById('alertaGlobal');
        el.className = `alerta-flotante alerta-${tipo}`;
        el.innerHTML = `<i class="bi bi-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'x-circle' : 'info-circle'} me-2"></i>${mensaje}`;
        el.classList.remove('d-none');
        clearTimeout(this._alertaTimer);
        this._alertaTimer = setTimeout(() => el.classList.add('d-none'), 3500);
    }
}

// ===== ARRANQUE =====
document.addEventListener('DOMContentLoaded', () => {
    new AppBiblioteca();
});
