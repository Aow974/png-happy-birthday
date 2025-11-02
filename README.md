# Audio de fond (musique)

Ce projet ajoute un lecteur audio de fond avec un bouton play/pause en haut à droite.

Où mettre le fichier audio :
- Placez votre fichier audio (MP3 ou autre) à la racine du projet et nommez-le `music.mp3`, ou modifiez l'attribut `src` de l'élément `<audio id="bgAudio">` dans `index.html` pour référencer un autre chemin ou une URL distante.

Autoplay et navigateurs :
- Les navigateurs modernes bloquent souvent l'autoplay non sollicité. Si la musique ne démarre pas automatiquement, clique sur le bouton en haut à droite pour démarrer la lecture.
- L'état (lecture / pause) est sauvegardé dans `localStorage` afin de restaurer la préférence de l'utilisateur lors des visites suivantes.

Comportement par défaut :
- Par défaut (si aucune préférence n'est encore enregistrée), le site tente de lancer la musique automatiquement. Si tu veux que la musique soit toujours en pause par défaut, ouvre `index.html` et ajoute dans la console du navigateur :
	```js
	localStorage.setItem('audioPlaying', 'false');
	```
	ou clique sur le bouton pour mettre la musique en pause — la préférence sera ensuite sauvegardée.

Conseil :
- Pour tester localement, ouvrez `index.html` dans un navigateur (double-cliquez) ou servez le dossier via un serveur local (par ex. `npx http-server` ou `python -m http.server`) pour éviter certains problèmes de lecture liés aux chemins de fichiers locaux.

Si tu veux que j'ajoute un track de démonstration hébergé en ligne ou que je bundle un petit exemple, dis-le et je l'ajouterai.
