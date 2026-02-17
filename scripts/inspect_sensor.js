require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkSensor() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    const devId = 'eb5961daada3fea21cvjau';

    try {
        console.log(`Verificando sensor: ${devId}`);
        const [rows] = await pool.execute('SELECT * FROM sensores WHERE devId = ?', [devId]);

        if (rows.length > 0) {
            console.log('❌ Sensor ENCONTRADO no banco de dados:');
            console.log(JSON.stringify(rows[0], null, 2));

            // Check owner info
            const [users] = await pool.execute('SELECT id, nome, email, role FROM usuarios WHERE id = ?', [rows[0].usuario_id]);
            if (users.length > 0) {
                console.log('Dono do Sensor:', JSON.stringify(users[0], null, 2));
            }

            // Check Reservoir
            const [reservatorios] = await pool.execute('SELECT * FROM reservatorios WHERE id = ?', [rows[0].reservatorio_id]);
            if (reservatorios.length > 0) {
                console.log('Reservatório Pai:', JSON.stringify(reservatorios[0], null, 2));
            } else {
                console.log('⚠️ Reservatório Pai (id ' + rows[0].reservatorio_id + ') NÃO encontrado. (Orfão?)');
            }

            // JOIN AND DELETE
            console.log('🗑️ Apagando sensor para corrigir o problema...');
            await pool.execute('DELETE FROM sensores WHERE devId = ?', [devId]);
            console.log('✅ Sensor removido com sucesso!');

        } else {
            console.log('✅ Sensor NÃO encontrado no banco de dados. (Deveria estar livre para cadastro)');
        }

    } catch (error) {
        console.error('Erro na verificação:', error);
    } finally {
        await pool.end();
    }
}

checkSensor();
