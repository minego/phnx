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
my $program = "cnvtSBEmojiCodeToUnicode.pl";
my $error = "$program error:";
my $warn = "$program warning:";

my $helpText = "Version $version\n"
          . "Usage: $program [-h|help] <srcEmojiList>\n";

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
my $srcEmojiList = $ARGV[0]; 
my %emojiCodeHash = ();

open EMOJICODELIST, "$srcEmojiList";
 
while (<STDIN>) {
  chomp $_;
	my @filenames = split('\t',$_);
	my $index = 0;
	for(my $i=0; $i<@filenames; $i=$i+2){
		$filenames[$i] =~ s/\\u0*//i;	
		$filenames[$i] =~ s/\\u/_/i;	
		$filenames[$i+1] =~ s/\\u0*//i;	
		$filenames[$i+1] =~ s/\\u/_/i;	
		
		#print "src: $filenames[$i+1] dst: $filenames[$i]\n";
		$emojiCodeHash{$filenames[$i+1]} = $filenames[$i];
		$index++;
	}

}

#while ( my ($key, $value) = each(%emojiCodeHash) ) {
#	print "$key => $value\n";
#}

while (<EMOJICODELIST>){
	my $input = $_;
	chomp $input;
	if($input){
		if($emojiCodeHash{$input}){
			#print "$input => " . $emojiCodeHash{$input} . "\n";
			print "'" . $emojiCodeHash{$input} . "',";
		} else{
			#print "$input => " . $input . "\n";
			print "'" . $input . "',";
		}
	}
}

close EMOJICODELIST;
