// ─── Domain Types ────────────────────────────────────────────

export interface Poll {
  id: string;
  question: string;
  created_at: string;
  options: PollOption[];
}

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  vote_count: number;
}

export interface Vote {
  id: string;
  poll_id: string;
  option_id: string;
  voter_ip: string;
  voter_fingerprint: string;
  created_at: string;
}

// ─── API Request / Response Types ────────────────────────────

export interface CreatePollRequest {
  question: string;
  options: string[];
}

export interface CreatePollResponse {
  poll: Poll;
}

export interface CastVoteRequest {
  option_id: string;
  fingerprint: string;
}

export interface CastVoteResponse {
  success: boolean;
  message: string;
}

export interface ApiError {
  error: string;
}

// ─── Supabase Database Types ─────────────────────────────────

export interface Database {
  public: {
    Tables: {
      polls: {
        Row: {
          id: string;
          question: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          question: string;
          created_at?: string;
        };
      };
      options: {
        Row: PollOption;
        Insert: {
          id?: string;
          poll_id: string;
          text: string;
          vote_count?: number;
        };
      };
      votes: {
        Row: Vote;
        Insert: {
          id?: string;
          poll_id: string;
          option_id: string;
          voter_ip: string;
          voter_fingerprint: string;
          created_at?: string;
        };
      };
    };
  };
}
