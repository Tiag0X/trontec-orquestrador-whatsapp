import requests
import json
import time

# Configurações
BASE_URL = "http://localhost:3000/api"
PASSWORD = "admin"  # Puxado do seu .env local

# IDs capturados do seu banco de dados local para um teste real
GROUP_ID = "f72c2f30-0613-4fd6-878f-18c99be754b2" # Testes
CONTACT_ID = "69edc212-2335-4e93-b8c7-135c145598cb" # Tiago

def test_hybrid_send():
    endpoint = f"{BASE_URL}/messages/send"
    
    headers = {
        "Content-Type": "application/json",
        "password": PASSWORD
    }
    
    payload = {
        "groupIds": [GROUP_ID],
        "contactIds": [CONTACT_ID],
        "message": "🚀 Teste de Disparo Híbrido (API + Python)\n\nEsta mensagem foi enviada simultaneamente para:\n- 1 Grupo 👥\n- 1 Contato Privado 👤 (Com delay de segurança Anti-Ban)"
    }
    
    print(f"📡 Enviando requisição para: {endpoint}")
    print(f"📦 Payload: {json.dumps(payload, indent=2, ensure_ascii=False)}")
    print("-" * 50)
    
    start_time = time.time()
    
    try:
        response = requests.post(endpoint, headers=headers, json=payload)
        duration = time.time() - start_time
        
        print(f"⏱️  Tempo de resposta: {duration:.2f} segundos")
        print(f"🚦 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ Resposta do Servidor:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
        else:
            print(f"\n❌ Erro: {response.text}")
            
    except Exception as e:
        print(f"\n❌ Falha na conexão: {str(e)}")

if __name__ == "__main__":
    # Garante que o servidor esteja rodando
    print("🔔 Certifique-se de que 'npm run dev' está rodando em outro terminal.")
    test_hybrid_send()
