# Spotify-Tracker
Analyze your Spotify usage

## Running the app
One server is used to serve client-side files and interface with Spotify. This can be run with `npm start -- <CLIs>`.

### Command-line arguments
| Name                 | Alias    | Type   | Default                            | Description                                                              |
|----------------------|----------|--------|------------------------------------|--------------------------------------------------------------------------|
| Redirect URI         | r        | string | `http://localhost/callback`        | Where Spotify should redirect the user after authorization.              |
| Port                 | p        | number | `80`                               | The port to run the HTTP and WS server on.                               |
| Client ID            | c        | string | `fb87a8dcc6504073a292ae657458c3ea` | The client ID of the Spotify app. Defaults to my client ID.              |
| Secret file location | s        | string | `./CLIENT_SECRET`                  | The location of a file containing the client secret for the Spotify app. |
