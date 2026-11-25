-- IRC Bridge role membership is now the sole consent control.
ALTER TABLE "users" DROP COLUMN "irc_bridge_opt_out";
