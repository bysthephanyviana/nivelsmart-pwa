CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'tecnico', 'sindico') DEFAULT 'sindico',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE condominios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    endereco VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    devId VARCHAR(100) NOT NULL,
    nome VARCHAR(150),
    cache_nivel INT DEFAULT NULL,
    cache_status JSON DEFAULT NULL,
    last_sync TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reservatorio_id) REFERENCES reservatorios (id) ON DELETE CASCADE,
    INDEX idx_devId (devId),
    INDEX idx_reservatorio (reservatorio_id)
);

-- Indices para performance
CREATE INDEX idx_usuarios_email ON usuarios (email);

CREATE INDEX idx_reservatorios_condominio ON reservatorios (condominio_id);