declare namespace Express {
  interface Request {
    id?: string | number | object
    authSession?: {
      sessionId: string
      userId: string
      phoneNumberMasked: string
      authState: 'verified'
      defaultHouseholdId: string | null
      lifecycleStatus: 'active'
      createdAt: string
    }
  }
}
