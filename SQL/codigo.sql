-- ==================== TABLAS PRINCIPALES ====================
CREATE EXTENSION IF NOT EXISTS postgis;
SELECT PostGIS_Version();

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    cedula VARCHAR(10) UNIQUE NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('acm', 'jefe_patrulla', 'supervisor', 'admin')),
    telefono VARCHAR(15),
    fecha_ingreso DATE,
    cargo VARCHAR(100),
    anio_graduacion INTEGER,
    cuenta_activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de reportes ACM
CREATE TABLE IF NOT EXISTS reportes_acm (
    id VARCHAR(50) PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre_completo VARCHAR(255) NOT NULL,
    cedula VARCHAR(10) NOT NULL,
    zona VARCHAR(50) NOT NULL,
    distrito VARCHAR(100) NOT NULL,
    circuito VARCHAR(10) NOT NULL,
    direccion TEXT NOT NULL,
    horario_jornada VARCHAR(50) NOT NULL,
    hora_reporte VARCHAR(10) NOT NULL,
    fecha DATE NOT NULL,
    novedad TEXT NOT NULL,
    reporta VARCHAR(255),

    tiene_coordenadas BOOLEAN DEFAULT false,
    tipo_reporte VARCHAR(50) DEFAULT 'encargado_cuadra',
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completado', 'revisado', 'archivado')),
    url_documento_word TEXT,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de imágenes de reportes
CREATE TABLE IF NOT EXISTS imagenes_reportes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporte_id VARCHAR(50) NOT NULL REFERENCES reportes_acm(id) ON DELETE CASCADE,
    url_storage TEXT NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    orden INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de leyes y normas
CREATE TABLE IF NOT EXISTS leyes_normas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de artículos de leyes/normas
CREATE TABLE IF NOT EXISTS leyes_normas_articulos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ley_norma_id UUID NOT NULL REFERENCES leyes_normas(id) ON DELETE CASCADE,
    numero_articulo VARCHAR(50) NOT NULL,
    contenido TEXT NOT NULL,
    descripcion_corta TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de relación reportes-leyes_normas
CREATE TABLE IF NOT EXISTS reportes_leyes_normas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporte_id VARCHAR(50) NOT NULL REFERENCES reportes_acm(id) ON DELETE CASCADE,
    ley_norma_id UUID NOT NULL REFERENCES leyes_normas(id) ON DELETE CASCADE,
    articulo_id UUID REFERENCES leyes_normas_articulos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(reporte_id, ley_norma_id, articulo_id)
);

-- Tabla de hojas de vida
CREATE TABLE IF NOT EXISTS hojas_vida (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    datos_personales JSONB NOT NULL DEFAULT '{}',
    formacion_academica JSONB NOT NULL DEFAULT '[]',
    experiencia_laboral JSONB NOT NULL DEFAULT '[]',
    cursos_capacitaciones JSONB NOT NULL DEFAULT '[]',
    habilidades JSONB NOT NULL DEFAULT '{}',
    referencias JSONB NOT NULL DEFAULT '[]',
    informacion_adicional JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== TABLAS DE SEGURIDAD ====================

-- Tabla de intentos de login
CREATE TABLE IF NOT EXISTS intentos_login (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    intento_exitoso BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    bloqueado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de tokens de reactivación
CREATE TABLE IF NOT EXISTS tokens_reactivacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(64) UNIQUE NOT NULL,
    expira_en TIMESTAMP WITH TIME ZONE NOT NULL,
    usado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== ÍNDICES ====================

-- Índices para usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_cedula ON usuarios(cedula);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_cuenta_activa ON usuarios(cuenta_activa);

-- Índices para reportes
CREATE INDEX idx_reportes_usuario_id ON reportes_acm(usuario_id);
CREATE INDEX idx_reportes_fecha ON reportes_acm(fecha);
CREATE INDEX idx_reportes_zona ON reportes_acm(zona);
CREATE INDEX idx_reportes_distrito ON reportes_acm(distrito);
CREATE INDEX idx_reportes_circuito ON reportes_acm(circuito);
CREATE INDEX idx_reportes_estado ON reportes_acm(estado);

ALTER TABLE reportes_acm
ADD COLUMN coordenadas geometry(Point, 4326);


 
CREATE INDEX idx_reportes_coordenadas ON reportes_acm USING GIST(coordenadas);

-- Índices para imágenes
CREATE INDEX idx_imagenes_reporte_id ON imagenes_reportes(reporte_id);

-- Índices para leyes/normas
CREATE INDEX idx_leyes_normas_categoria ON leyes_normas(categoria);
CREATE INDEX idx_leyes_normas_articulos_ley_id ON leyes_normas_articulos(ley_norma_id);

-- Índices para relaciones
CREATE INDEX idx_reportes_leyes_reporte_id ON reportes_leyes_normas(reporte_id);
CREATE INDEX idx_reportes_leyes_ley_id ON reportes_leyes_normas(ley_norma_id);

-- Índices para hojas de vida
CREATE INDEX idx_hojas_vida_usuario_id ON hojas_vida(usuario_id);

-- Índices para seguridad
CREATE INDEX idx_intentos_login_email ON intentos_login(email);
CREATE INDEX idx_intentos_login_created_at ON intentos_login(created_at);
CREATE INDEX idx_tokens_reactivacion_token ON tokens_reactivacion(token);
CREATE INDEX idx_tokens_reactivacion_expira_en ON tokens_reactivacion(expira_en);

-- ==================== FUNCIONES Y TRIGGERS ====================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reportes_acm_updated_at 
    BEFORE UPDATE ON reportes_acm 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leyes_normas_updated_at 
    BEFORE UPDATE ON leyes_normas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hojas_vida_updated_at 
    BEFORE UPDATE ON hojas_vida 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para generar ID único de reporte
CREATE OR REPLACE FUNCTION generar_id_reporte()
RETURNS TRIGGER AS $$
DECLARE
    nuevo_id VARCHAR(50);
BEGIN
    -- Generar ID único: REP-{timestamp}-{random}
    nuevo_id := 'REP-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || 
                UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    
    NEW.id := nuevo_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para generar ID de reporte
CREATE TRIGGER generar_id_reporte_trigger
    BEFORE INSERT ON reportes_acm
    FOR EACH ROW
    EXECUTE FUNCTION generar_id_reporte();

-- Función para actualizar coordenadas
CREATE OR REPLACE FUNCTION actualizar_coordenadas()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.coordenadas IS NOT NULL THEN
        NEW.tiene_coordenadas := true;
    ELSE
        NEW.tiene_coordenadas := false;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar bandera de coordenadas
CREATE TRIGGER actualizar_coordenadas_trigger
    BEFORE INSERT OR UPDATE ON reportes_acm
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_coordenadas();

-- ==================== DATOS INICIALES ====================


-- Insertar usuario admin por defecto (contraseña: Admin123)
INSERT INTO usuarios (
    id,
    email,
    password,
    nombre_completo,
    cedula,
    rol,
    telefono,
    cargo,
    cuenta_activa
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'admin@seguraep.gob.ec',
    '$2b$10$8BzA3Q7V6x9cR2dF4g5h6iJ7kL8mN9o0p1q2r3s4t5u6v7w8x9y0z', -- Admin123 encriptada
    'ADMINISTRADOR SISTEMA',
    '9999999999',
    'admin',
    '0999999999',
    'Administrador del Sistema',
    true
) ON CONFLICT (id) DO NOTHING;

-- Insertar leyes/normas predefinidas
INSERT INTO leyes_normas (nombre, categoria, descripcion) VALUES
('COIP - Código Orgánico Integral Penal', 'Penal', 'Código que regula las infracciones y delitos penales'),
('COESCOP - Código Orgánico de las Entidades de Seguridad Ciudadana', 'Seguridad', 'Código que regula las funciones de seguridad ciudadana'),
('Constitución del Ecuador', 'Constitucional', 'Constitución de la República del Ecuador'),
('Ordenanza Municipal de Control y Espacio Público', 'Municipal', 'Ordenanza que regula el control y uso del espacio público'),
('Ley Orgánica de Transporte Terrestre', 'Transporte', 'Ley que regula el transporte terrestre')
ON CONFLICT DO NOTHING;

-- Insertar artículos predefinidos
INSERT INTO leyes_normas_articulos (ley_norma_id, numero_articulo, contenido, descripcion_corta)
SELECT id, '205', 'Ocupación, uso indebido de suelo o tránsito de vía pública', 'Ocupación indebida de vía pública'
FROM leyes_normas WHERE nombre = 'COIP - Código Orgánico Integral Penal'
UNION ALL
SELECT id, '207', 'Invasión de áreas de importancia ecológica o de uso público', 'Invasión de áreas protegidas'
FROM leyes_normas WHERE nombre = 'COIP - Código Orgánico Integral Penal'
UNION ALL
SELECT id, '282', 'Destrucción de señalización de tránsito', 'Daño a señalética vial'
FROM leyes_normas WHERE nombre = 'COIP - Código Orgánico Integral Penal'
UNION ALL
SELECT id, '45', 'Atribuciones del Control Municipal', 'Funciones y atribuciones del control municipal'
FROM leyes_normas WHERE nombre = 'COESCOP - Código Orgánico de las Entidades de Seguridad Ciudadana'
UNION ALL
SELECT id, '46', 'Control del espacio público', 'Control y vigilancia del espacio público'
FROM leyes_normas WHERE nombre = 'COESCOP - Código Orgánico de las Entidades de Seguridad Ciudadana'
ON CONFLICT DO NOTHING;

-- ==================== POLÍTICAS RLS (Row Level Security) ====================

-- Habilitar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes_acm ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagenes_reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE leyes_normas ENABLE ROW LEVEL SECURITY;
ALTER TABLE leyes_normas_articulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes_leyes_normas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hojas_vida ENABLE ROW LEVEL SECURITY;
ALTER TABLE intentos_login ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens_reactivacion ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
CREATE POLICY "Usuarios pueden ver su propio perfil" ON usuarios
    FOR SELECT USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON usuarios
    FOR UPDATE USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin puede ver todos los usuarios" ON usuarios
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para reportes
CREATE POLICY "Usuarios pueden ver sus propios reportes" ON reportes_acm
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden crear reportes" ON reportes_acm
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden actualizar sus propios reportes" ON reportes_acm
    FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Admin puede ver todos los reportes" ON reportes_acm
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para hojas de vida
CREATE POLICY "Usuarios pueden ver su propia hoja de vida" ON hojas_vida
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden gestionar su propia hoja de vida" ON hojas_vida
    FOR ALL USING (auth.uid() = usuario_id OR auth.jwt() ->> 'role' = 'admin');

-- Políticas para leyes/normas (lectura pública)
CREATE POLICY "Cualquiera puede ver leyes/normas" ON leyes_normas
    FOR SELECT USING (true);

CREATE POLICY "Solo admin puede modificar leyes/normas" ON leyes_normas
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ==================== VISTAS ====================

-- Vista para estadísticas de reportes
CREATE OR REPLACE VIEW vista_estadisticas_reportes AS
SELECT 
    u.id as usuario_id,
    u.nombre_completo,
    u.rol,
    COUNT(r.id) as total_reportes,
    COUNT(CASE WHEN r.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as reportes_30_dias,
    MIN(r.created_at) as primer_reporte,
    MAX(r.created_at) as ultimo_reporte
FROM usuarios u
LEFT JOIN reportes_acm r ON u.id = r.usuario_id
GROUP BY u.id, u.nombre_completo, u.rol;

-- Vista para reportes con información completa
CREATE OR REPLACE VIEW vista_reportes_completos AS
SELECT 
    r.*,
    u.nombre_completo as usuario_nombre,
    u.cedula as usuario_cedula,
    u.rol as usuario_rol,
    COUNT(i.id) as total_imagenes,
    COUNT(rln.id) as total_leyes_normas
FROM reportes_acm r
LEFT JOIN usuarios u ON r.usuario_id = u.id
LEFT JOIN imagenes_reportes i ON r.id = i.reporte_id
LEFT JOIN reportes_leyes_normas rln ON r.id = rln.reporte_id
GROUP BY r.id, u.id;

-- ==================== COMENTARIOS ====================

COMMENT ON TABLE usuarios IS 'Tabla de usuarios del sistema ACM';
COMMENT ON TABLE reportes_acm IS 'Tabla de reportes generados por los agentes ACM';
COMMENT ON TABLE imagenes_reportes IS 'Tabla de imágenes adjuntas a los reportes';
COMMENT ON TABLE leyes_normas IS 'Tabla de leyes y normas aplicables';
COMMENT ON TABLE leyes_normas_articulos IS 'Tabla de artículos específicos de leyes/normas';
COMMENT ON TABLE reportes_leyes_normas IS 'Tabla de relación entre reportes y leyes/normas aplicadas';
COMMENT ON TABLE hojas_vida IS 'Tabla de hojas de vida de los usuarios';
COMMENT ON TABLE intentos_login IS 'Registro de intentos de login para seguridad';
COMMENT ON TABLE tokens_reactivacion IS 'Tokens para reactivación de cuentas';

-- ==================== GRANTS ====================

-- Conceder permisos al rol postgres (admin)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Conceder permisos básicos al rol anon (Supabase)
GRANT SELECT ON leyes_normas TO anon;
GRANT SELECT ON leyes_normas_articulos TO anon;
GRANT INSERT ON intentos_login TO anon;
GRANT INSERT ON usuarios TO anon;

-- Asegúrate que RLS esté habilitado
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes_acm ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios vean solo sus datos
CREATE POLICY "Usuarios ven solo su perfil" ON usuarios
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuarios ven solo sus reportes" ON reportes_acm
  FOR SELECT USING (auth.uid() = usuario_id);
  -- Para acm-reportes
CREATE POLICY "Permitir todo en acm-reportes"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'acm-reportes');

-- Para acm-documentos  
CREATE POLICY "Permitir todo en acm-documentos"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'acm-documentos');

ALTER TABLE reportes_acm 
ALTER COLUMN usuario_id DROP NOT NULL;


ALTER TABLE reportes_acm 
DROP CONSTRAINT IF EXISTS reportes_acm_usuario_id_fkey;

ALTER TABLE reportes_acm 
ADD CONSTRAINT reportes_acm_usuario_id_fkey 
FOREIGN KEY (usuario_id) 
REFERENCES usuarios(id) 
ON DELETE SET NULL;

-- Permitir que usuarios no autenticados creen reportes
CREATE POLICY "Cualquiera puede crear reportes" ON reportes_acm
    FOR INSERT WITH CHECK (true);

-- Permitir que usuarios vean sus propios reportes y reportes públicos
CREATE POLICY "Usuarios ven sus reportes y públicos" ON reportes_acm
    FOR SELECT USING (
        auth.uid() = usuario_id 
        OR usuario_id IS NULL 
        OR auth.jwt() ->> 'role' = 'admin'
    );

-- Permitir que usuarios actualicen sus propios reportes
CREATE POLICY "Usuarios actualizan sus reportes" ON reportes_acm
    FOR UPDATE USING (
        auth.uid() = usuario_id 
        OR auth.jwt() ->> 'role' = 'admin'
    );





-- Permitir lectura pública de reportes (solo ciertos campos)
CREATE POLICY "Cualquiera puede ver reportes públicos" ON reportes_acm
    FOR SELECT USING (true);


CREATE POLICY "Cualquiera puede ver artículos de leyes/normas" ON leyes_normas_articulos
    FOR SELECT USING (true);

-- Permitir lectura pública de imágenes de reportes
CREATE POLICY "Cualquiera puede ver imágenes de reportes" ON imagenes_reportes
    FOR SELECT USING (true);

-- Permitir lectura pública de relaciones reportes-leyes
CREATE POLICY "Cualquiera puede ver relaciones reportes-leyes" ON reportes_leyes_normas
    FOR SELECT USING (true);


SELECT * FROM usuarios;


-- ==================== ARTÍCULOS DE COIP - PENAL ====================
INSERT INTO leyes_normas_articulos (ley_norma_id, numero_articulo, contenido, descripcion_corta)
SELECT id, '45', 'Homicidio doloso', 'Homicidio intencional'
FROM leyes_normas WHERE nombre = 'COIP - Código Orgánico Integral Penal'
UNION ALL
SELECT id, '146', 'Robo agravado', 'Robo con agravantes'
FROM leyes_normas WHERE nombre = 'COIP - Código Orgánico Integral Penal'
UNION ALL
SELECT id, '155', 'Abuso sexual', 'Delitos sexuales'
FROM leyes_normas WHERE nombre = 'COIP - Código Orgánico Integral Penal'
UNION ALL
SELECT id, '181', 'Estafa y fraude', 'Fraude económico'
FROM leyes_normas WHERE nombre = 'COIP - Código Orgánico Integral Penal'
UNION ALL
SELECT id, '194', 'Extorsión', 'Delito de extorsión'
FROM leyes_normas WHERE nombre = 'COIP - Código Orgánico Integral Penal'
UNION ALL
SELECT id, '205', 'Ocupación, uso indebido de suelo o tránsito de vía pública', 'Ocupación indebida de vía pública'
FROM leyes_normas WHERE nombre = 'COIP - Código Orgánico Integral Penal'
UNION ALL
SELECT id, '207', 'Invasión de áreas de importancia ecológica o de uso público', 'Invasión de áreas protegidas'
FROM leyes_normas WHERE nombre = 'COIP - Código Orgánico Integral Penal'
UNION ALL
SELECT id, '212', 'Lesiones personales', 'Daño físico a otra persona'
FROM leyes_normas WHERE nombre = 'COIP - Código Orgánico Integral Penal'
UNION ALL
SELECT id, '218', 'Tráfico de drogas', 'Delitos relacionados con drogas'
FROM leyes_normas WHERE nombre = 'COIP - Código Orgánico Integral Penal'
UNION ALL
SELECT id, '282', 'Destrucción de señalización de tránsito', 'Daño a señalética vial'
FROM leyes_normas WHERE nombre = 'COIP - Código Orgánico Integral Penal'
ON CONFLICT DO NOTHING;

-- ==================== ARTÍCULOS DE COESCOP - SEGURIDAD ====================
INSERT INTO leyes_normas_articulos (ley_norma_id, numero_articulo, contenido, descripcion_corta)
SELECT id, '45', 'Atribuciones del Control Municipal', 'Funciones y atribuciones del control municipal'
FROM leyes_normas WHERE nombre = 'COESCOP - Código Orgánico de las Entidades de Seguridad Ciudadana'
UNION ALL
SELECT id, '46', 'Control del espacio público', 'Control y vigilancia del espacio público'
FROM leyes_normas WHERE nombre = 'COESCOP - Código Orgánico de las Entidades de Seguridad Ciudadana'
UNION ALL
SELECT id, '50', 'Seguridad en eventos masivos', 'Regulación de seguridad en eventos'
FROM leyes_normas WHERE nombre = 'COESCOP - Código Orgánico de las Entidades de Seguridad Ciudadana'
UNION ALL
SELECT id, '52', 'Funciones de patrullaje', 'Normas sobre patrullaje'
FROM leyes_normas WHERE nombre = 'COESCOP - Código Orgánico de las Entidades de Seguridad Ciudadana'
UNION ALL
SELECT id, '55', 'Prevención de delitos', 'Acciones preventivas en seguridad'
FROM leyes_normas WHERE nombre = 'COESCOP - Código Orgánico de las Entidades de Seguridad Ciudadana'
UNION ALL
SELECT id, '60', 'Cooperación con Policía Nacional', 'Colaboración institucional'
FROM leyes_normas WHERE nombre = 'COESCOP - Código Orgánico de las Entidades de Seguridad Ciudadana'
UNION ALL
SELECT id, '65', 'Control de tránsito y movilidad', 'Supervisión de tránsito'
FROM leyes_normas WHERE nombre = 'COESCOP - Código Orgánico de las Entidades de Seguridad Ciudadana'
UNION ALL
SELECT id, '70', 'Uso de la fuerza', 'Normas sobre uso de fuerza'
FROM leyes_normas WHERE nombre = 'COESCOP - Código Orgánico de las Entidades de Seguridad Ciudadana'
UNION ALL
SELECT id, '75', 'Sanciones administrativas', 'Multas y sanciones'
FROM leyes_normas WHERE nombre = 'COESCOP - Código Orgánico de las Entidades de Seguridad Ciudadana'
UNION ALL
SELECT id, '80', 'Protección de personas vulnerables', 'Medidas de protección'
FROM leyes_normas WHERE nombre = 'COESCOP - Código Orgánico de las Entidades de Seguridad Ciudadana'
ON CONFLICT DO NOTHING;

-- ==================== ARTÍCULOS DE CONSTITUCIÓN DEL ECUADOR - CONSTITUCIONAL ====================
INSERT INTO leyes_normas_articulos (ley_norma_id, numero_articulo, contenido, descripcion_corta)
SELECT id, '1', 'La soberanía reside en el pueblo', 'Soberanía popular'
FROM leyes_normas WHERE nombre = 'Constitución del Ecuador'
UNION ALL
SELECT id, '11', 'Derechos de igualdad y no discriminación', 'Igualdad ante la ley'
FROM leyes_normas WHERE nombre = 'Constitución del Ecuador'
UNION ALL
SELECT id, '66', 'Derecho a la vida', 'Protección de la vida'
FROM leyes_normas WHERE nombre = 'Constitución del Ecuador'
UNION ALL
SELECT id, '66', 'Derecho a la salud', 'Protección del derecho a la salud'
FROM leyes_normas WHERE nombre = 'Constitución del Ecuador'
UNION ALL
SELECT id, '70', 'Derecho a la educación', 'Acceso a educación'
FROM leyes_normas WHERE nombre = 'Constitución del Ecuador'
UNION ALL
SELECT id, '75', 'Derecho a la seguridad social', 'Seguridad social para todos'
FROM leyes_normas WHERE nombre = 'Constitución del Ecuador'
UNION ALL
SELECT id, '84', 'Libertad de expresión', 'Derecho a la comunicación'
FROM leyes_normas WHERE nombre = 'Constitución del Ecuador'
UNION ALL
SELECT id, '89', 'Derecho a la información', 'Acceso a información pública'
FROM leyes_normas WHERE nombre = 'Constitución del Ecuador'
UNION ALL
SELECT id, '96', 'Derecho a la propiedad', 'Propiedad privada'
FROM leyes_normas WHERE nombre = 'Constitución del Ecuador'
UNION ALL
SELECT id, '98', 'Derecho a un medio ambiente sano', 'Protección ambiental'
FROM leyes_normas WHERE nombre = 'Constitución del Ecuador'
ON CONFLICT DO NOTHING;

-- ==================== ARTÍCULOS ORDENANZA MUNICIPAL - MUNICIPAL ====================
INSERT INTO leyes_normas_articulos (ley_norma_id, numero_articulo, contenido, descripcion_corta)
SELECT id, '1', 'Regulación del uso de espacio público', 'Uso de espacio público'
FROM leyes_normas WHERE nombre = 'Ordenanza Municipal de Control y Espacio Público'
UNION ALL
SELECT id, '5', 'Normas de publicidad exterior', 'Publicidad en espacios públicos'
FROM leyes_normas WHERE nombre = 'Ordenanza Municipal de Control y Espacio Público'
UNION ALL
SELECT id, '10', 'Protección de parques y plazas', 'Cuidado de parques'
FROM leyes_normas WHERE nombre = 'Ordenanza Municipal de Control y Espacio Público'
UNION ALL
SELECT id, '15', 'Regulación de comercio ambulante', 'Comercio informal'
FROM leyes_normas WHERE nombre = 'Ordenanza Municipal de Control y Espacio Público'
UNION ALL
SELECT id, '20', 'Mantenimiento de aceras y vías', 'Cuidado de calles'
FROM leyes_normas WHERE nombre = 'Ordenanza Municipal de Control y Espacio Público'
UNION ALL
SELECT id, '25', 'Sanciones por incumplimiento', 'Multas y sanciones'
FROM leyes_normas WHERE nombre = 'Ordenanza Municipal de Control y Espacio Público'
UNION ALL
SELECT id, '30', 'Control de ruido', 'Normas de ruido'
FROM leyes_normas WHERE nombre = 'Ordenanza Municipal de Control y Espacio Público'
UNION ALL
SELECT id, '35', 'Seguridad en eventos públicos', 'Eventos seguros'
FROM leyes_normas WHERE nombre = 'Ordenanza Municipal de Control y Espacio Público'
UNION ALL
SELECT id, '40', 'Protección de patrimonio histórico', 'Cuidado del patrimonio'
FROM leyes_normas WHERE nombre = 'Ordenanza Municipal de Control y Espacio Público'
UNION ALL
SELECT id, '45', 'Cooperación con policía municipal', 'Colaboración institucional'
FROM leyes_normas WHERE nombre = 'Ordenanza Municipal de Control y Espacio Público'
ON CONFLICT DO NOTHING;

-- ==================== ARTÍCULOS LEY ORGÁNICA DE TRANSPORTE TERRESTRE - TRANSPORTE ====================
INSERT INTO leyes_normas_articulos (ley_norma_id, numero_articulo, contenido, descripcion_corta)
SELECT id, '1', 'Regulación de transporte público', 'Normas transporte público'
FROM leyes_normas WHERE nombre = 'Ley Orgánica de Transporte Terrestre'
UNION ALL
SELECT id, '10', 'Licencias de conducir', 'Requisitos para licencia'
FROM leyes_normas WHERE nombre = 'Ley Orgánica de Transporte Terrestre'
UNION ALL
SELECT id, '15', 'Normas de tránsito', 'Cumplimiento de tránsito'
FROM leyes_normas WHERE nombre = 'Ley Orgánica de Transporte Terrestre'
UNION ALL
SELECT id, '20', 'Seguridad vial', 'Medidas de seguridad'
FROM leyes_normas WHERE nombre = 'Ley Orgánica de Transporte Terrestre'
UNION ALL
SELECT id, '25', 'Sanciones por infracciones', 'Multas de tránsito'
FROM leyes_normas WHERE nombre = 'Ley Orgánica de Transporte Terrestre'
UNION ALL
SELECT id, '30', 'Transporte escolar', 'Normas transporte escolar'
FROM leyes_normas WHERE nombre = 'Ley Orgánica de Transporte Terrestre'
UNION ALL
SELECT id, '35', 'Transporte de carga', 'Regulación transporte de carga'
FROM leyes_normas WHERE nombre = 'Ley Orgánica de Transporte Terrestre'
UNION ALL
SELECT id, '40', 'Inspección vehicular', 'Control de vehículos'
FROM leyes_normas WHERE nombre = 'Ley Orgánica de Transporte Terrestre'
UNION ALL
SELECT id, '45', 'Transporte interprovincial', 'Regulación interprovincial'
FROM leyes_normas WHERE nombre = 'Ley Orgánica de Transporte Terrestre'
UNION ALL
SELECT id, '50', 'Cooperación con autoridades', 'Colaboración institucional'
FROM leyes_normas WHERE nombre = 'Ley Orgánica de Transporte Terrestre'
ON CONFLICT DO NOTHING;

SELECT * FROM leyes_normas_articulos;
