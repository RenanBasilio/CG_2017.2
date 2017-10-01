# Trabalho 2

O trabalho consiste na implementação de um sistema que permita o desenho de um polígono a partir de uma sequência de pontos (com o desenho dos segmentos de reta que representam suas arestas antes de sua finalização). Após desenhado o polígono, deve-se haver a possibilidade de se "pregar" o mesmo ao canvas ou a outro polígono. Essa ação deve colocar o polígono em uma hierarquia, através da qual será aplicado _forward kinematics_ ao mesmo e demais polígonos aparentados a este. Deve-se ainda poder fazer o _picking_ do polígono e transladar o mesmo (se este não tiver parent) ou rotacionar em torno do "prego" (se este tiver parent).

O projeto for realizado utilizando a biblioteca three.js. Para executar, execute os seguintes comandos em um terminal neste diretório:
~~~
npm install
npm start
~~~
O projeto estará disponível na em http://localhost:8080

O repositório referente ao projeto pode ser encontrado em https://github.com/RenanBasilio/CG_2017.2


## Funcionalidades Implementadas