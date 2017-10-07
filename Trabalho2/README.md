# Trabalho 2

O trabalho consiste na implementação de um sistema que permita o desenho de um polígono a partir de uma sequência de pontos (com o desenho dos segmentos de reta que representam suas arestas antes de sua finalização). Após desenhado o polígono, deve-se haver a possibilidade de se "pregar" o mesmo ao canvas ou a outro polígono. Essa ação deve colocar o polígono em uma hierarquia, através da qual será aplicado _forward kinematics_ ao mesmo e demais polígonos aparentados a este. Deve-se ainda poder fazer o _picking_ do polígono e transladar o mesmo (se este não tiver parent) ou rotacionar em torno do "prego" (se este tiver parent).

O projeto for realizado utilizando as bibliotecas 
[three.js](https://threejs.org/), 
[http-server](https://www.npmjs.com/package/http-server) e 
[live-server](https://www.npmjs.com/package/live-server).

A primeira forma de executar o projeto é simplesmente abrindo [index.html](index.html) com um browser. Nesse caso será utilizada uma versão do three.js de uma CDN.

Alternativamente, para instalar localmente as bibliotecas, execute os seguintes comandos em um terminal neste diretório:
~~~
npm install
npm start
~~~
O projeto estará disponível em http://localhost:8080.

O repositório referente ao projeto pode ser encontrado em https://github.com/RenanBasilio/CG_2017.2.

Todos os trabalhos podem ser executados online em https://renanbasilio.github.io/CG_2017.2.


## Funcionalidades Implementadas
* Desenho de polígonos através de uma sequência de segmentos de reta.
* Abilidade de desfazer o primeiro traço de um novo polígono.
* Abilidade de pregar um polígono a outro.
  * O polígono tratado como pai será sempre o mais antigo da hierarquia entre o par.
* _Picking_ de polígono.
* Translação do polígono selecionado através do _picking_ se este não estiver pregado.
* Rotação do polígono selecionado através do _picking_ em torno do prego se este estiver pregado. 