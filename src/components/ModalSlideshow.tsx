import { useState, useEffect } from 'react'
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase'
import { uploadToImgBB } from '../services/imgbb'

interface ModalSlideshowProps {
  aberto: boolean
  onFechar: () => void
}

interface Slide {
  id: string
  url: string
  createdAt: string
}

export function ModalSlideshow({ aberto, onFechar }: ModalSlideshowProps) {
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!aberto) return
    const q = query(collection(db, 'slideshow'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      const data: Slide[] = []
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() } as Slide))
      setSlides(data)
      setLoading(false)
    })
    return () => unsub()
  }, [aberto])

  if (!aberto) return null

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const url = await uploadToImgBB(file)
      await addDoc(collection(db, 'slideshow'), {
        url,
        createdAt: new Date().toISOString()
      })
    } catch (error) {
      console.error(error)
      alert('Erro ao fazer upload da imagem.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover esta imagem do slideshow público?')) {
      try {
        await deleteDoc(doc(db, 'slideshow', id))
      } catch (error) {
        console.error(error)
        alert('Erro ao excluir a imagem.')
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-fade-in">
        
        <div className="flex items-center justify-between p-6 border-b border-brand-secondary/20">
          <div>
            <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2">
              <span className="text-2xl">🖼️</span> Gerenciar Slideshow
            </h2>
            <p className="text-brand-dark/60 text-sm">Adicione ou remova imagens da capa do site público.</p>
          </div>
          <button onClick={onFechar} className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand-dark/60 hover:bg-brand-secondary/20 transition-colors">
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-brand-light/30">
          {/* Upload Area */}
          <div className="mb-8">
            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${uploading ? 'border-brand-secondary bg-brand-secondary/10 cursor-not-allowed' : 'border-brand-primary/50 bg-brand-primary/5 hover:bg-brand-primary/10'}`}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                <span className="text-3xl mb-2">{uploading ? '⏳' : '📤'}</span>
                <p className="text-sm font-semibold text-brand-dark">
                  {uploading ? 'Enviando imagem, aguarde...' : 'Clique para adicionar uma nova imagem ao Slideshow'}
                </p>
                <p className="text-xs text-brand-dark/50 mt-1">Recomendado: 1920x1080 (formato paisagem)</p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>

          {/* Galeria */}
          <h3 className="font-bold text-brand-dark mb-4">Imagens Ativas ({slides.length})</h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
          ) : slides.length === 0 ? (
            <div className="text-center py-10 text-brand-dark/50">
              Nenhuma imagem cadastrada no slideshow.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {slides.map(slide => (
                <div key={slide.id} className="relative group rounded-xl overflow-hidden shadow-sm border border-brand-secondary/20 bg-white">
                  <div className="aspect-video w-full">
                    <img src={slide.url} alt="Slide" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => handleDelete(slide.id)}
                      className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors shadow-lg flex items-center gap-2 text-sm"
                    >
                      <span>🗑️</span> Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
