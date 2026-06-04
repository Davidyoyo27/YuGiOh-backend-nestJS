
export default () => ({
    jwt: {
        accessExpires: process.env.JWT_ACCESS_TIME_EXPIRES,
        refreshExpires: process.env.JWT_REFRESH_TIME_EXPIRES,
    },
});
