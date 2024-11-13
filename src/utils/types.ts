export enum Role {
    USER,
    ADMIN,
    SUPERADMIN
}

export type responseObject = {
    code: number;
    success: boolean;
    message: string;
}
