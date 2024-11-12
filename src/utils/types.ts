export enum Role {
    USER,
    ADMIN,
    SUPERADMIN
}

// export enum CampaignType {
//     USER,
//     FAVORITES,
//     VOTED,
//     ALL
// }

export type responseObject = {
    code: number;
    success: boolean;
    message: string;
}
