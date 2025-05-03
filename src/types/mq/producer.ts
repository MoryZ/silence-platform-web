export interface ProducerConnection {
  connectionSet: ConnectionSet[] 
}

export interface ConnectionSet {
  clientId: string
  clientAddr: string
  language: Language
  version: number
}

export enum Language {
  JAVA = 0,
  CPP = 1,
  DOTNET = 2,
  PYTHON = 3,
  DELPHI = 4,
  ERLANG = 5,
  RUBY = 6,
  OTHER = 7,
  HTTP = 8,
  GO = 9,
  PHP = 10,
  OMS = 11,
  RUST = 12
}