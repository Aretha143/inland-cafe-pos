// Global type declarations for the server

declare module 'express' {
  interface Request {
    user?: {
      id: number;
      username: string;
      role: string;
      full_name: string;
      email?: string;
      password_hash?: string;
    };
  }
}

declare module 'mssql' {
  export * from 'mssql';
}

declare module 'bcryptjs' {
  export * from 'bcryptjs';
}

declare module 'better-sqlite3' {
  export * from 'better-sqlite3';
}

declare module 'jsonwebtoken' {
  export * from 'jsonwebtoken';
}

declare module 'cors' {
  export * from 'cors';
}
