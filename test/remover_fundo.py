from rembg import remove
from PIL import Image
import os

input_path = os.path.join(os.path.dirname(__file__), "polvo.jpg")  # Caminho para data.txt na mesma pasta do script
output_path = 'imagem_sem_fundo.png'  # Fundo removido

input_image = Image.open(input_path)
output_image = remove(input_image, alpha_matting=True, alpha_matting_foreground_threshold=240)
output_image.save(output_path)