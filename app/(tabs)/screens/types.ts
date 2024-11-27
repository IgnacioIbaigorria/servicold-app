export type RootStackParamList = {
    Loading: undefined;
    Home: undefined;
    Admin: undefined;
    SensorList: undefined;
    SensorDetail: { sensorName: string, sensorId: number }; 
    Login: undefined;
    Permisos: undefined;
    Notifications: { notifications: string[] }; 
    Settings: undefined;
    Ayuda: undefined;
    ResetPassword: {token: string};
    VerifyCode: undefined;
    Registro: undefined;
};
