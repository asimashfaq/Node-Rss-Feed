declare module 'node-podcast-parser'

export interface Description {
    long: string
    short: string
}

export interface Owner {
    name: string
    email: string
}

export interface Enclosure {
    filesize: number
    type: string
    url: string
}

export interface Episode {
    title: string
    published: Date
    guid: string
    description: string
    enclosure: Enclosure
    explicit: boolean
    duration: number
    episode: string
    episodeType: string
    image: string
}

export interface Feed {
    categories: string[]
    title: string
    link: string
    description: Description
    updated: Date
    language: string
    ttl: number
    type: string
    author: string
    owner: Owner
    explicit: boolean
    image: string
    episodes: Episode[]
}
