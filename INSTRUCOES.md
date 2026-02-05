# NIVELSMART-IOT Backend

Backend completo para monitoramento de nível de reservatórios usando sensores Tuya.

## 1. Instalação

Abra o terminal na pasta do projeto e execute:

```bash
npm install
```

## 2. Configuração do Banco de Dados

1. Certifique-se de ter o MySQL rodando.
2. Crie um banco de dados chamado `nivelsmart_iot`.
3. Execute o script `schema.sql` no seu banco de dados para criar as tabelas.

## 3. Configuração de Variáveis de Ambiente

1. Crie um arquivo `.env` na raiz do projeto (use `.env.example` como base).
2. Preencha as credenciais da Tuya (**IoT Platform** > Cloud > Development > Seu Projeto > Overview):

```ini
TUYA_CLIENT_ID=seu_client_id
TUYA_CLIENT_SECRET=seu_client_secret
DB_HOST=localhost
DB_USER=root
DB_PASS=sua_senha_mysql
DB_NAME=nivelsmart_iot
JWT_SECRET=super_secret_key
PORT=3000
```

> **Data Center:** O projeto está configurado por padrão para **Western America Data Center** (`openapi.tuyaus.com`). Certifique-se de que este Data Center está **Ativo** no seu projeto Tuya.

## 4. Passo CRÍTICO: Vincular Dispositivo

Para evitar erros de "Permission Deny", você DEVE vincular sua conta do App Tuya ao projeto Cloud:

1. Na Plataforma Tuya IoT, vá em **Cloud** > **Development** > **Seu Projeto**.
2. Clique na aba **Devices** > **Link Tuya App Account**.
3. Escaneie o QR Code com o App Tuya (Smart Life ou Tuya Smart) onde o sensor está instalado.
4. Confirme que o sensor aparece na lista "Device List" da aba Devices.

## 5. Execução

Para rodar o servidor em modo de desenvolvimento:

```bash
npm run dev
```

## 6. Testar a Rota do Sensor

Para ver os dados reais do seu sensor, acesse no navegador usando o **ID Real** (que aparece na lista de Devices):

`http://localhost:3000/sensor/status/SEU_ID_REAL_DO_SENSOR`
*(Exemplo: `http://localhost:3000/sensor/status/bf3847...`)*

Se retornar JSON com dados, parabéns! O backend está conectado.

## Solução de Problemas

- **Erro "sign invalid"**: Significa que o ID do dispositivo não existe ou contém espaços. Verifique se copiou o ID exato da lista de dispositivos na nuvem.
- **Erro "permission deny"**: Significa que o dispositivo existe, mas seu Projeto Cloud não tem acesso a ele. Siga o **Passo 4** acima para vincular a conta do App.
- **Erro "Data center suspended"**: A região configurada no código (Western) não foi ativada na sua conta Tuya. Ative-a no painel "Service Status".
