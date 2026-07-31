export const uploadToImgBB = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('image', file)
  
  // Substitua 'SUA_CHAVE_AQUI' pela chave real da API do ImgBB. 
  // No caso de projetos reais, isso geralmente vem do import.meta.env
  const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || 'e37130eb5cd76e0176883e18a4a5daaa' // Chave pública/padrão de teste
  
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData,
  })

  const data = await response.json()
  
  if (data.success) {
    return data.data.url
  } else {
    throw new Error('Falha no upload da imagem para o ImgBB')
  }
}
