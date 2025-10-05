import paramiko
import os
host = "38.242.199.148"  # Substitua pelo IP da sua VPS
username = "root"     # Ou o usuário configurado na VPS
key_path = "C:/Users/Issei/.ssh/id_rsa"  # Caminho da chave privada
#local_path = os.path.join(os.path.dirname(__file__), "app-release.apk")  # Caminho para data.txt na mesma pasta do script
#local_path = os.path.join(os.path.dirname(__file__), "../services/userService.js")  # Caminho para data.txt na mesma pasta do script
#local_path = os.path.join(os.path.dirname(__file__), "../sockets/socketHandler.js")  # Caminho para data.txt na mesma pasta do script
local_path = os.path.join(os.path.dirname(__file__), "../services/wppService.js")  # Caminho para data.txt na mesma pasta do script
#local_path = os.path.join(os.path.dirname(__file__), "../index.js")  # Caminho para data.txt na mesma pasta do script
#local_path = os.path.join(os.path.dirname(__file__), "../test_canva/carteira_canva_.js")  # Caminho para data.txt na mesma pasta do script
#local_path = os.path.join(os.path.dirname(__file__), "../email/agendar.js")  # Caminho para data.txt na mesma pasta do script
#remote_path = "/var/www/html/polvoceu.apk"  # Caminho na VPS
#remote_path = "/var/www/fidelidadebot/services/userService.js"  # Caminho na VPS
#remote_path = "/var/www/fidelidadebot/sockets/socketHandler.js"  # Caminho na VPS
remote_path = "/var/www/fidelidadebot/services/wppService.js"  # Caminho na VPS
#remote_path = "/var/www/fidelidadebot/index.js"  # Caminho na VPS
#remote_path = "/var/www/fidelidadebot/canva/canva.js"  # Caminho na VPS
#remote_path = "/var/www/fidelidadebot/email/agendar.js"  # Caminho na VPS


ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=username, key_filename=key_path)
sftp = ssh.open_sftp()
sftp.put(local_path, remote_path)
sftp.close()
ssh.close()

print("Arquivo enviado com sucesso!")