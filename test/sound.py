import tensorflow_hub as hub
import tensorflow as tf

# Carregar o modelo
model = hub.load('https://tfhub.dev/google/yamnet/1')

# Salvar o modelo como `.saved_model` (tamanho reduzido para exportação)
model.save('yamnet_saved_model')
