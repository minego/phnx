#!/usr/bin/perl
#
# (C) 2012-2016 David Cole
#
# Free to use and modify by everyone
#
# V2.00 : 18-08-16 : Added ability to sort to a master list
# V1.00 : 20-03-08 : Initial release 
#

use strict;
use English;

my $version = 2.00;

# help and usage
my $program = "cnvtSBEmojiCodeToUnicode2.pl";
my $error = "$program error:";
my $warn = "$program warning:";

my $helpText = "Version $version\n"
          . "Usage: $program [-h|help] <existingEmojiFileList> <masterSortedUnicodeList>\n"
		  . "\nNotes:\n"
		  . "\tPipe SoftBank to Unicode list into program\n"
		  . "\t<masterSortedUnicodeList can be cleaned with cmd: cat ../full_unicode_list_20160822.txt | grep -E \"^[0-9]+\" > ../full_unicode_list_20160822_nocomments.txt\n"
  		  . "Example:\n\tcat Any_SoftBankSMS.txt | ./cnvtSBEmojiCodeToUnicode.pl image_listing_201608018_clean.txt full_emoji_unicode_ordered_list_prepped_20151224.txt > tmp2_new.txt\n";

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
my $orderedEmojiList = $ARGV[1];
my %emojiCodeHash = ();
my %emojiFileCodeHash = ();
my @orderedList =();
my $emojiCode;
my @unfoundEmojiCodeList = ();
my $flag =0;

open EMOJICODELIST, "$srcEmojiList";
open ORDEREDEMOJICODELIST, "$orderedEmojiList";
 
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

while (<ORDEREDEMOJICODELIST>){
	chomp $_;

	my @codes = split('\t',$_);
	for(my $i=0; $i<@codes; $i=$i+2){
		$codes[$i] =~ s/U\+//i;	
		$codes[$i] =~ s/ U\+/_/i;	
		#$codes[$i+1] =~ s/U\+//i;	
		#$codes[$i+1] =~ s/\\u/_/i;	
		$codes[$i] = lc($codes[$i]);
		push(@orderedList,$codes[$i]);
	}
}

close ORDEREDEMOJICODELIST;

while (<EMOJICODELIST>){
	my $input = $_;
	chomp $input;
	if($input){
		if($emojiCodeHash{$input}){
			#print "$input => " . $emojiCodeHash{$input} . "\n";
			##print "'" . $emojiCodeHash{$input} . "',";
			$emojiFileCodeHash{$emojiCodeHash{$input}[0]} = $emojiCodeHash{$input};
			$emojiFileCodeHash{$emojiCodeHash{$input}[1]} = 0;
		} else{
			#print "$input => " . $input . "\n";
			##print "'" . $input . "',";
			$emojiFileCodeHash{$input}[0] = $input;
			$emojiFileCodeHash{$input}[1] = 0;
		}
	}
}

close EMOJICODELIST;

foreach $emojiCode (@orderedList){
	#print "$emojiCode: ";
	if($emojiFileCodeHash{$emojiCode}[0]){
		#print "found\n";
		print "'" . uc $emojiCode . "',";
		$emojiFileCodeHash{$emojiCode}[1] = 1;
	}
	else{
		#print "not found\n";
		my $truncatedEmojiCode = $emojiCode;
		$truncatedEmojiCode =~ s/_2764_fe0f/_2764/g; 
		$truncatedEmojiCode =~ s/_200d//g; 
		$truncatedEmojiCode =~ s/_fe0f_20e3/_20e3/g;
		if($emojiFileCodeHash{$truncatedEmojiCode}[0]){
			print "'" . uc $truncatedEmojiCode . "',";
			$emojiFileCodeHash{$truncatedEmojiCode}[1] = 1;
			###print $emojiCode . " : " . $truncatedEmojiCode . "\n";
		} else {
			###print "\n" . $emojiCode . " : " . $truncatedEmojiCode . "\n";
			$emojiFileCodeHash{$emojiCode}[2] = 0;
			$emojiFileCodeHash{$emojiCode}[1] = 0;
			push(@unfoundEmojiCodeList,$emojiCode);
		}
	}
}

for my $unusedEmojiFileKey (sort keys %emojiFileCodeHash){
	if($emojiFileCodeHash{$unusedEmojiFileKey}[1] == 0){
		if($flag == 0) {
			$flag = 1;
			print "\n\nEmoji files that are not referenced in master Unicode list:\n";
		}
		#print $unusedEmojiFileKey . "\n";
		#print $emojiFileCodeHash{$unusedEmojiFileKey}[0] . " = " . $emojiFileCodeHash{$unusedEmojiFileKey}[1] . " = " . $emojiFileCodeHash{$unusedEmojiFileKey}[2] . "\n";
		if($emojiFileCodeHash{$unusedEmojiFileKey}[0]) {
			print $emojiFileCodeHash{$unusedEmojiFileKey}[0] . "\n";
		}
	}
}

if(@unfoundEmojiCodeList){
	print "\n\nEmoji codes with unfound associated files:\n";
	foreach my $unfound (@unfoundEmojiCodeList){
		print "$unfound\n";
	}
}
