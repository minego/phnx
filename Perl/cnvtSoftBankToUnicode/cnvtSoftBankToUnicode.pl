#!/usr/bin/perl
#
# (C) 2012 David Cole
#
# Free to use and modify by everyone
#
# V1.00 : 20-03-08 : Initial release 
#

use strict;
use English;

my $version = 1.00;

# help and usage
my $program = "cnvtSoftBankToUnicode.pl";
my $error = "$program error:";
my $warn = "$program warning:";

my $helpText = "Version $version\n"
          . "Usage: $program [-h|help][-g|go] <srcPngDir> <dstPngDir>\n";

# parse commandline arguments
my $opt=1;
my $arg;
my $clamp = 0;
my $clamped = 0;
my $keep = 0;

# exit unless there are command line arguments
#die $helpText unless (@ARGV);

my $cmdline =  "> $program ";
my $goFlag = 0;

foreach my $argument (@ARGV) {
  $cmdline = $cmdline . $argument . " ";
}

while ($opt && ($arg=shift @ARGV)) {
  if ($arg eq "-help") {
    die $helpText;
  }
  elsif ($arg eq '-h') {
    die $helpText;
  }
  elsif ($arg eq '-g') {
	$goFlag = 1;
  }
  elsif ($arg eq '-go') {
	$goFlag = 1;
  }
  elsif (substr($arg,0,1) eq '-') {
    warn "$error Unknown option $arg\n\n";
    die $helpText;
  }
  else {
    unshift @ARGV, $arg;
    $opt=0;
  }
}

die $helpText unless ($ARGV[1]);
my $pngSrcFolder = $ARGV[0]; 
my $pngDstFolder = $ARGV[1]; 

while (<STDIN>) {
  chomp $_;
	my @filenames = split('\t',$_);
	my $index = 0;
	for(my $i=0; $i<@filenames; $i=$i+2){
		$filenames[$i] =~ s/\\u0*//i;	
		$filenames[$i] =~ s/\\u/_/i;	
		$filenames[$i+1] =~ s/\\u0*//i;	
		$filenames[$i+1] =~ s/\\u/_/i;	
		print "src: $pngSrcFolder/emoji-$filenames[$i+1].png dst: $pngDstFolder/$filenames[$i].png\n";
		if($goFlag == 1){
			my $cpCmd = "cp $pngSrcFolder/emoji-$filenames[$i+1].png $pngDstFolder/$filenames[$i].png";
			print "$cpCmd\n";
			system($cpCmd);
		}
		$index++;
	}
}

