export interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
}

export interface Article {
  id: string
  title: string
  excerpt: string
  date: any
}

export interface ContactForm {
  name: string
  email: string
  phone: string
  message: string
}

export interface User {
  uid: string
  email: string | null
  displayName: string | null
}
