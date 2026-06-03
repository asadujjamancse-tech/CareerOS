export interface Tag {
  id: string
  name: string
  slug: string
  color_hex: string
  created_at: string
  updated_at: string
}

export interface TagWithCount extends Tag {
  usage_count: number
}
