export type Book = {
  title: string
  number: number
  audios: AudioSource[]
  sections: string[]
}

export type AudioSource = {
  name: string
  url: string
}
