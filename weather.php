<?php
/*
 * http://service.salzburg.gv.at/ogd/client/showDetail/bad388c1-e13f-484d-ba51-331a79537f5f
 */
$jsonp_callback = $_GET['callback'];
$data = utf8_encode(file_get_contents("https://www.salzburg.gv.at/ogd/bad388c1-e13f-484d-ba51-331a79537f5f/meteorologie-aktuell.csv"));
$lines = explode("\n", $data);

$headers = str_getcsv(array_shift($lines), ";"); // currently ignored

$results = array();
foreach ($lines as $line) {
    $row = str_getcsv($line, ";");
    $place = $row[0];
    $param = $row[1];
    $time = $row[2];
    $value = $row[3];
    if (trim($place) !== "" && $value !== "?" && $value !== "-") { // ignore unknown values
        if (!$results[$place]) {
            $results[$place] = array();
        }
        if (!$results[$place][$param]) {
            $results[$place][$param] = array();
        }
        $results[$place][$param][$time] = $value;
    }
}

$json = json_encode($results);

if ($jsonp_callback) {
    header('Content-Type: application/javascript; charset=utf-8');
    print "$jsonp_callback($json)";
} else {
    header('Content-Type: application/json; charset=utf-8');
    print $json;
}
