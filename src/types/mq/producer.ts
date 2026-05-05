export type ProducerConnection = ConnectionSet[]

export interface ConnectionSet {
  clientId: string
  clientAddr: string
  language: string
  version: number
  versionDesc?: string
}
