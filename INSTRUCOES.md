# NIVELSMART-IOT: Guia Completo de Instalação e Testes

Este projeto consiste em um **Backend Node.js** robusto integrado à Tuya Cloud e um **Frontend React PWA** moderno e responsivo.

---

## 🚀 1. Instalação

### Backend
1. Abra o terminal na pasta raiz:
   ```bash
   npm install
   ```

### Frontend
1. Entre na pasta `frontend`:
   ```bash
   cd frontend
   npm install
   ```

---

## 🗄️ 2. Banco de Dados

1. Certifique-se de ter o MySQL rodando.
2. Crie o banco:
   ```sql
   CREATE DATABASE nivelsmart_iot;
   ```
3. Execute o script principal de tabelas:
   ```bash
   mysql -u root -p nivelsmart_iot < schema.sql
   ```
4. **IMPORTANTE - Migração Multi-Sensor:**
   Execute o script para atualizar as tabelas e habilitar múltiplos sensores por usuário:
   ```bash
   node scripts/migrate_sensor_ownership.js
   ```

---

## 🔑 3. Configuração (.env)

Crie um arquivo `.env` na raiz do projeto com suas credenciais Tuya e Banco de Dados:

```ini
TUYA_CLIENT_ID=seu_client_id
TUYA_CLIENT_SECRET=seu_client_secret
DB_HOST=localhost
DB_USER=root
DB_PASS=sua_senha
DB_NAME=nivelsmart_iot
JWT_SECRET=chave_secreta_jwt
PORT=3000
```

> **Atenção:** Certifique-se de vincular sua conta do **App Tuya (Smart Life)** ao **Projeto Cloud** em *Cloud > Development > Link Tuya App Account*.

---

## ▶️ 4. Execução

Você precisa de dois terminais rodando simultaneamente.

**Terminal 1 (Backend):**
```bash
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
Acesse o sistema em: `http://localhost:5173`

---

## 🧪 5. Novos Testes e Rotas (Atualizado)

### 📡 Backend: Novas Rotas Multi-Sensor
Todas as rotas abaixo requerem Autenticação (Header `Authorization: Bearer SEU_TOKEN`).

1.  **Listar Meus Sensores**
    *   **Método:** `GET`
    *   **URL:** `http://localhost:3000/sensores/meus-sensores`
    *   **Resultado:** Retorna lista de todos os sensores vinculados ao seu usuário, buscando status atualizado de cada um na Tuya.

2.  **Detalhes do Sensor (Pelo ID Interno)**
    *   **Método:** `GET`
    *   **URL:** `http://localhost:3000/sensores/sensor/1`  *(Onde 1 é o ID do banco)*
    *   **Resultado:** Dados completos do sensor específico.

3.  **Vincular Novo Sensor**
    *   **Método:** `POST`
    *   **URL:** `http://localhost:3000/sensores/vincular`
    *   **Body:**
        ```json
        {
          "reservatorio_id": 1,
          "devId": "SEU_ID_TUYA_AQUI",
          "nome": "Caixa D'água Principal"
        }
        ```

### 📱 Frontend: Teste de Layout Responsivo (Híbrido)

O sistema agora se adapta drasticamente dependendo do dispositivo:

**Teste no Desktop (Tela Cheia):**
1.  Abra no navegador em tela cheia.
2.  Verifique a **sidebar azul fixa** na esquerda.
3.  Verifique se os cards (Condomínios/Reservatórios) aparecem em **Grade (Colunas)**.

**Teste no Mobile (Simulação):**
1.  Redimensione a janela do navegador para ficar estreita (como um celular).
2.  Verifique a transformação:
    *   A Sidebar **desaparece**.
    *   Aparece um container centralizado simulando um app.
    *   Surge um **Header** no topo com botão de perfil.
    *   Os cards ficam em **Lista Vertical**.

---

## 🛠️ Solução de Problemas

*   **Erro "Permission Deny" na Tuya:** O projeto cloud não está vinculado à conta do app que tem o sensor. Refaça o passo de vínculo na plataforma Tuya.
*   **Sign Invalid:** Verifique se o `TUYA_CLIENT_ID` e `SECRET` estão corretos e sem espaços.
### 🛡️ Autenticação Necessária (Postman)

Todas as rotas acima são protegidas. Se receber erro `"Token não fornecido"`, siga:

1.  **Login (Para pegar o token)**:
    *   **POST** `http://localhost:3000/auth/login`
    *   **Body (JSON)**:
        ```json
        { "email": "admin@nivelsmart.com", "senha": "admin" }
        ```
    *   Copie o `token` que vier na resposta.

2.  **Usar o Token**:
    *   No Postman, na aba **Authorization** da requisição.
    *   Tipo: **Bearer Token**.
    *   Cole o token.
    *   Enviar Requisição.

---

## 📱 6. Funcionalidades de Frontend (Novo)

### Vincular Sensor (Sem mexer no Banco)
1.  No menu lateral, clique em **"Vincular Sensor"** (ícone `+`).
2.  Selecione o **Condomínio**.
3.  A lista de **Reservatórios** carregará automaticamente. Selecione um.
4.  Cole o **Device ID** da Tuya e dê um nome.
5.  Clique em Salvar. Pronto!

### Visualização de Hierarquia
*   Acesse **Dashboard > Condomínio > Reservatórios**.
*   Agora, cada card de reservatório mostra uma **lista de sensores** vinculados.
*   Você consegue ver o nível de múltiplos sensores (ex: Caixa 1, Caixa 2, Cisterna) agrupados no mesmo lugar.
