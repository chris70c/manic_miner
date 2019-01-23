<?php

  date_default_timezone_set('America/New_York');

  function save($buffer) {
    //file_put_contents('manic-compiled.js', $buffer);
    return $buffer;
  }

  ob_start('save');

  $list = array(
    'bootstrap',
    'webgl',
    'controls',
    'audio',
    'helpers',
    'records',
    'tile',
    'room',
    'panel',
    'sprites',
    'hero',
    'game',
    'private'
  );

  echo <<<neo
window.addEventListener("load", () => {
"use strict";\n\n
neo;

  foreach ($list as $file) {
    require_once "manic/{$file}.js";
    echo "\n\n";
  }

  echo <<<neo
});
neo;

  header('content-type:text/javascript');
  ob_end_flush();

?>