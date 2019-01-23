<?php

  if (isset($_POST)) {
    $index = $_POST['index'];
    $score = $_POST['score'];
    $name  = $_POST['name'];

    $data = json_decode(file_get_contents('spectrum.json'));

    array_splice($data->records, $index, 0, (int)$score);
    array_splice($data->players, $index, 0, $name);

    array_pop($data->records);
    array_pop($data->players);

    file_put_contents('spectrum.json', json_encode($data));
  }

?>