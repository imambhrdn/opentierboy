'use client';

import React, {useState, useRef, useCallback} from 'react';
import html2canvasPro from 'html2canvas-pro';
import {Button} from "@/components/ui/button";
import {DownloadIcon} from '@radix-ui/react-icons';
import {toast} from 'sonner';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";

interface QuickDownloadButtonProps {
  title: string;
}

const QuickDownloadButton: React.FC<QuickDownloadButtonProps> = ({title}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadTierList = useCallback(async () => {
    setIsDownloading(true);

    try {
      // Find the main tier list container - use a more reliable selector
      const tierListElement = document.querySelector('main > div > div > div:last-child') ||
                             document.querySelector('.max-w-screen-lg.mx-auto.px-4 > div > div:last-child') ||
                             document.querySelector('[data-rfd-droppable-context-id]')?.parentElement?.parentElement?.parentElement;

      if (!tierListElement) {
        throw new Error('Tier list element not found');
      }

      // Capture the tier list
      const canvas = await html2canvasPro(tierListElement as HTMLElement, {
        backgroundColor: '#09090b', // Dark mode background
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;

          // Generate filename from title
          const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'tierlist';
          link.download = `${safeTitle}_tierlist.png`;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast.success('Tier list downloaded successfully!');
        }
      }, 'image/png');

    } catch (error) {
      console.error('Error downloading tier list:', error);
      toast.error('Failed to download tier list');
    } finally {
      setIsDownloading(false);
    }
  }, [title]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={downloadTierList}
            disabled={isDownloading}
            data-html2canvas-ignore
          >
            <DownloadIcon className={`h-4 w-4 ${isDownloading ? 'animate-pulse' : ''}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Download tier list as PNG</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default QuickDownloadButton;