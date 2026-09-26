import fs from "fs";
import os from "os";
import path from "path";

type Config = {
    dbUrl: string;
    currentUserName?: string;
};

function getConfigFilePath(): string {
    return path.join(os.homedir(), ".gatorconfig.json");
}

function writeConfig(config: Config): void {
    const rawConfig = {
        db_url: config.dbUrl,
        current_user_name: config.currentUserName
    };

    fs.writeFileSync(
        getConfigFilePath(),
        JSON.stringify(rawConfig, null, 2),
        "utf-8"
    );
}

function validateConfig(rawConfig: any): Config {
    if (
        typeof rawConfig !== "object" ||
        rawConfig === null ||
        typeof rawConfig.db_url !== "string"
    ) {
        throw new Error("Invalid configuration");
    }

    if (
        rawConfig.current_user_name !== undefined &&
        typeof rawConfig.current_user_name !== "string"
    ) {
        throw new Error("Invalid configuration");
    }

    return {
        dbUrl: rawConfig.db_url,
        currentUserName: rawConfig.current_user_name
    };
}

export function readConfig(): Config {
    const configPath: string = getConfigFilePath();
    const fileContent: string = fs.readFileSync(configPath, "utf-8");
    const rawConfig: any = JSON.parse(fileContent);

    return validateConfig(rawConfig);
}

export function setUser(username: string): void {
    const config: Config = readConfig();

    config.currentUserName = username;

    writeConfig(config);
}
