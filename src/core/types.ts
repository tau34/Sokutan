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

export type RepeatMode = "off" | "one" | "all" | "custom"
