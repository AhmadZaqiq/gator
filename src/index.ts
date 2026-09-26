import {
    CommandsRegistry,
    handlerLogin,
    handlerRegister,
    handlerReset,
    handlerUsers,
    handlerAgg,
    handlerAddFeed,
    handlerFollow,
    handlerFollowing,
    handlerUnfollow,
    handlerBrowse,
    middlewareLoggedIn,
    handlerFeeds,
    registerCommand,
    runCommand
} from "./commands.js";

async function main(): Promise<void> {
    const registry: CommandsRegistry = {};

    registerCommand(registry, "login", handlerLogin);
    registerCommand(registry, "register", handlerRegister);
    registerCommand(registry, "reset", handlerReset);
    registerCommand(registry, "users", handlerUsers);
    registerCommand(registry, "agg", handlerAgg);
    registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));
    registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
    registerCommand(registry, "following", middlewareLoggedIn(handlerFollowing));
registerCommand(
    registry,
    "unfollow",
    middlewareLoggedIn(handlerUnfollow)
);
    registerCommand(registry, "feeds", handlerFeeds);
    registerCommand(
        registry,
        "browse",
        middlewareLoggedIn(handlerBrowse)
    );

    const args: string[] = process.argv.slice(2);

    if (args.length === 0) {
        console.error("Error: not enough arguments");
        process.exit(1);
    }

    const cmdName: string = args[0];
    const cmdArgs: string[] = args.slice(1);

    try {
        await runCommand(registry, cmdName, ...cmdArgs);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }

    process.exit(0);
}

main();
