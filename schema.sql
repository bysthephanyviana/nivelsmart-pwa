CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'USER', -- RBAC: 'USER' or 'ADMIN'
    telefone VARCHAR(20), -- Added field based on common auth needs, verifying in controller
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE condominios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL, -- Fixed: Added missing relationship owner
    nome VARCHAR(150) NOT NULL,
    endereco VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
);

CREATE TABLE reservatorios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    condominio_id INT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    capacidade_litros INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (condominio_id) REFERENCES condominios (id) ON DELETE CASCADE
);

CREATE TABLE sensores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservatorio_id INT NOT NULL,
    usuario_id INT NOT NULL, -- Redundant but useful for quick permission checks (denormalization)
    devId VARCHAR(100) NOT NULL UNIQUE,
    nome VARCHAR(150),
    cache_nivel INT DEFAULT NULL,
    cache_status JSON DEFAULT NULL,
    last_sync TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reservatorio_id) REFERENCES reservatorios (id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    INDEX idx_devId (devId) -- Critical for sync performance
);

-- Indices para performance
CREATE INDEX idx_usuarios_email ON usuarios (email);

CREATE INDEX idx_condominios_usuario ON condominios (usuario_id);

CREATE INDEX idx_reservatorios_condominio ON reservatorios (condominio_id);