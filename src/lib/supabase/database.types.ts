export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      User: {
        Row: {
          id: string
          email: string
          name: string | null
          tier: string
          isAdmin: boolean
          stripeCustomerId: string | null
          fingerprintHash: string | null
          parentAgencyId: string | null
          brandingLogoUrl: string | null
          brandingColor: string | null
          agencyName: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          tier?: string
          isAdmin?: boolean
          stripeCustomerId?: string | null
          fingerprintHash?: string | null
          parentAgencyId?: string | null
          brandingLogoUrl?: string | null
          brandingColor?: string | null
          agencyName?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          tier?: string
          isAdmin?: boolean
          stripeCustomerId?: string | null
          fingerprintHash?: string | null
          parentAgencyId?: string | null
          brandingLogoUrl?: string | null
          brandingColor?: string | null
          agencyName?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      AgencyMember: {
        Row: {
          id: string
          agencyId: string
          tutorId: string
          joinedAt: string
        }
        Insert: {
          id?: string
          agencyId: string
          tutorId: string
          joinedAt?: string
        }
        Update: {
          id?: string
          agencyId?: string
          tutorId?: string
          joinedAt?: string
        }
      }
      AgencyInvite: {
        Row: {
          id: string
          agencyId: string
          code: string
          invitedEmail: string | null
          recipientId: string | null
          status: string
          expiresAt: string
          createdAt: string
        }
        Insert: {
          id?: string
          agencyId: string
          code: string
          invitedEmail?: string | null
          recipientId?: string | null
          status?: string
          expiresAt: string
          createdAt?: string
        }
        Update: {
          id?: string
          agencyId?: string
          code?: string
          invitedEmail?: string | null
          recipientId?: string | null
          status?: string
          expiresAt?: string
          createdAt?: string
        }
      }
      Room: {
        Row: {
          id: string
          tutorId: string
          subject: string
          isActive: boolean
          startedAt: string | null
          endedAt: string | null
          durationMinutes: number
          brandingLogo: string | null
          brandingColor: string | null
          createdAt: string
        }
        Insert: {
          id?: string
          tutorId: string
          subject?: string
          isActive?: boolean
          startedAt?: string | null
          endedAt?: string | null
          durationMinutes?: number
          brandingLogo?: string | null
          brandingColor?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          tutorId?: string
          subject?: string
          isActive?: boolean
          startedAt?: string | null
          endedAt?: string | null
          durationMinutes?: number
          brandingLogo?: string | null
          brandingColor?: string | null
          createdAt?: string
        }
      }
      BoardPage: {
        Row: {
          id: string
          roomId: string
          pageIndex: number
          snapshot: Json
          createdAt: string
        }
        Insert: {
          id?: string
          roomId: string
          pageIndex: number
          snapshot: Json
          createdAt?: string
        }
        Update: {
          id?: string
          roomId?: string
          pageIndex?: number
          snapshot?: Json
          createdAt?: string
        }
      }
      Template: {
        Row: {
          id: string
          tutorId: string
          name: string
          subject: string
          snapshot: Json
          createdAt: string
        }
        Insert: {
          id?: string
          tutorId: string
          name: string
          subject?: string
          snapshot: Json
          createdAt?: string
        }
        Update: {
          id?: string
          tutorId?: string
          name?: string
          subject?: string
          snapshot?: Json
          createdAt?: string
        }
      }
      ChatMessage: {
        Row: {
          id: string
          roomId: string
          senderId: string | null
          senderLabel: string
          content: string
          fileUrl: string | null
          fileName: string | null
          isPinned: boolean
          createdAt: string
        }
        Insert: {
          id?: string
          roomId: string
          senderId?: string | null
          senderLabel: string
          content: string
          fileUrl?: string | null
          fileName?: string | null
          isPinned?: boolean
          createdAt?: string
        }
        Update: {
          id?: string
          roomId?: string
          senderId?: string | null
          senderLabel?: string
          content?: string
          fileUrl?: string | null
          fileName?: string | null
          isPinned?: boolean
          createdAt?: string
        }
      }
      UsageLog: {
        Row: {
          id: string
          userId: string
          periodStartDate: string
          videoMinutesUsed: number
          aiCreditsUsed: number
          estimatedAiSpendCents: number
        }
        Insert: {
          id?: string
          userId: string
          periodStartDate: string
          videoMinutesUsed?: number
          aiCreditsUsed?: number
          estimatedAiSpendCents?: number
        }
        Update: {
          id?: string
          userId?: string
          periodStartDate?: string
          videoMinutesUsed?: number
          aiCreditsUsed?: number
          estimatedAiSpendCents?: number
        }
      }
    }
  }
}
