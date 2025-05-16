#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[]) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s \"commit message\"\n", argv[0]);
        return 1;
    }

    // Build the git commit command with the user's input
    char command[1024];
    snprintf(command, sizeof(command),
             "git add . && git commit -m \"%s\" && git push origin main", argv[1]);

    // Run the command
    int result = system(command);

    if (result != 0) {
        fprintf(stderr, "Error: Command failed.\n");
        return 1;
    }

    return 0;
}
