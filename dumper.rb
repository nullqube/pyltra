# Define the output file name
output_file = 'combined_output.txt'

# Open the output file in write mode
File.open(output_file, 'w') do |outfile|
  # Search recursively for files matching *.js or *.mjs
  Dir.glob('**/*.{js,mjs}').each do |file_path|
    # Skip the output file itself if it matches the pattern
    next if file_path == output_file

    # Skip files inside node_modules folder
    next if file_path.include?('node_modules')

    begin
      # Write the file name and folder as a header
      outfile.puts "========================================"
      outfile.puts "File: #{file_path}"
      outfile.puts "========================================"
      outfile.puts ""

      # Open the source file and append its content
      File.read(file_path, encoding: 'UTF-8').each_line do |line|
        outfile.puts line
      end

      # Add a newline for separation
      outfile.puts ""
    rescue => e
      puts "Could not read file: #{file_path}. Error: #{e.message}"
    end
  end
end

puts "All files have been combined into '#{output_file}'."